import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.models.donation import Donation
from backend.models.donation_request import DonationRequest
from backend.models.pickup import PickupRecord
from backend.services.notification_service import NotificationService
from backend.services.audit_service import AuditService
from backend.utils.time_utils import utc_now

pickup_bp = Blueprint("pickups", __name__, url_prefix="/api/v1/pickups")

@pickup_bp.route("/verify", methods=["POST"])
@pickup_bp.route("/verify-and-complete", methods=["POST"])
@jwt_required()
def verify_and_complete_pickup():
    """
    On-site physical handover verification.
    Requires matching the 6-digit OTP pickup code, confirming the safety checklist,
    verifying within safety window before collection deadline,
    and optionally recording food temperature.
    Atomic transaction ensures accurate portions transition.
    """
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.get_json() or {}
    request_id = data.get("request_id")
    entered_otp = str(data.get("pickup_code", "")).strip()
    temperature = data.get("temperature_at_collection") if data.get("temperature_at_collection") is not None else data.get("pickup_temperature_celsius")
    checklist_verified = data.get("safety_checklist_verified") if data.get("safety_checklist_verified") is not None else data.get("safety_checklist_confirmed", True)
    pickup_notes = (data.get("pickup_notes") or data.get("notes") or "").strip()
    collector_name = data.get("collector_name")
    collector_phone = data.get("collector_phone")
    
    if not request_id or not entered_otp:
        return jsonify({"error": "Request ID and 6-digit handover OTP code are required."}), 400
        
    if not checklist_verified:
        return jsonify({"error": "Mandatory safety checklist must be completed prior to handover confirmation."}), 400
        
    try:
        temp_val = float(temperature) if temperature is not None and str(temperature).strip() != "" else None
    except ValueError:
        return jsonify({"error": "Invalid temperature value."}), 400
        
    try:
        req = db.session.get(DonationRequest, request_id, with_for_update=True)
        if not req:
            db.session.rollback()
            return jsonify({"error": "Claim request not found."}), 404
            
        donation = db.session.get(Donation, req.donation_id, with_for_update=True)
        if not donation:
            db.session.rollback()
            return jsonify({"error": "Associated donation not found."}), 404
        
        # Only donor or receiver associated with this request or admin can verify
        if user.id not in [donation.donor_id, req.receiver_id] and user.role != "ADMIN":
            db.session.rollback()
            return jsonify({"error": "You are not authorized to confirm this pickup."}), 403
            
        # Prevent duplicate pickup records or re-submitting already completed claims
        if req.pickup_record or req.status == "PICKED_UP":
            db.session.rollback()
            return jsonify({"error": "Pickup has already been verified and recorded."}), 409
            
        if req.status != "APPROVED":
            db.session.rollback()
            return jsonify({"error": f"Cannot complete pickup. Request status is '{req.status}' (must be APPROVED)."}), 400
            
        # Food safety deadline check: Expired listings cannot be collected
        if donation.is_expired:
            donation.status = "EXPIRED"
            req.status = "REJECTED"
            req.rejection_reason = "Donation collection deadline expired prior to pickup completion."
            db.session.commit()
            return jsonify({
                "error": "Donation collection deadline has expired. Expired food cannot be safely handed over per FSSAI regulations."
            }), 400
            
        # Verify 6-digit OTP code
        if req.pickup_code != entered_otp:
            db.session.rollback()
            AuditService.log_event("FAILED_OTP_ATTEMPT", "DonationRequest", req.id, user.id)
            return jsonify({"error": "Invalid pickup verification code. Please check the 6-digit OTP displayed on the receiver's dashboard."}), 400
            
        portions = req.requested_portions
        
        # Transition portions: move from reserved to collected
        donation.reserved_portions = max(0, donation.reserved_portions - portions)
        donation.collected_portions += portions
        
        # Update donation status
        if donation.collected_portions >= donation.total_portions:
            donation.status = "COMPLETED"
        elif donation.remaining_portions > 0:
            donation.status = "PUBLISHED"
        else:
            donation.status = "COLLECTED"
            
        req.status = "PICKED_UP"
        
        pickup_record = PickupRecord(
            donation_id=donation.id,
            request_id=req.id,
            receiver_id=req.receiver_id,
            donor_id=donation.donor_id,
            confirmed_portions=portions,
            verification_method="OTP_PIN",
            pickup_notes=pickup_notes,
            temperature_at_collection=temp_val,
            safety_checklist_verified=checklist_verified,
            collected_at=utc_now()
        )
        db.session.add(pickup_record)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e
    
    # Send confirmations to both parties
    NotificationService.send_notification(
        user_id=donation.donor_id,
        title="Food Handover Verified!",
        message=f"{portions} portions of '{donation.title}' successfully picked up by recipient organization.",
        notif_type="PICKUP",
        link=f"/dashboard/donations/{donation.id}"
    )
    NotificationService.send_notification(
        user_id=req.receiver_id,
        title="Pickup Completed Successfully!",
        message=f"Collection of {portions} portions of '{donation.title}' confirmed.",
        notif_type="PICKUP",
        link="/dashboard/pickups"
    )
    
    AuditService.log_event(
        "PICKUP_CONFIRMED",
        "PickupRecord",
        pickup_record.id,
        user.id,
        {
            "portions": portions,
            "donation_id": donation.id,
            "final_donation_status": donation.status,
            "temperature_c": temp_val
        }
    )
    
    return jsonify({
        "message": "Pickup verified and completed successfully!",
        "pickup_record": pickup_record.to_dict(),
        "donation_status": donation.status
    }), 200

@pickup_bp.route("/history", methods=["GET"])
@jwt_required()
def get_pickup_history():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if user.role == "RECEIVER":
        records = PickupRecord.query.filter_by(receiver_id=user.id).order_by(PickupRecord.collected_at.desc()).all()
    elif user.role == "DONOR":
        records = PickupRecord.query.filter_by(donor_id=user.id).order_by(PickupRecord.collected_at.desc()).all()
    else:
        records = PickupRecord.query.order_by(PickupRecord.collected_at.desc()).limit(100).all()
        
    return jsonify({"pickups": [p.to_dict() for p in records]}), 200
