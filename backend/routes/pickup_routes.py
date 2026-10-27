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

pickup_bp = Blueprint("pickups", __name__, url_prefix="/api/v1/pickups")

@pickup_bp.route("/verify-and-complete", methods=["POST"])
@jwt_required()
def verify_and_complete_pickup():
    """
    On-site physical handover verification.
    Requires matching the 6-digit OTP pickup code, confirming the safety checklist,
    and optionally recording food temperature.
    Atomic transaction ensures accurate portions transition.
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    data = request.get_json() or {}
    request_id = data.get("request_id")
    entered_otp = str(data.get("pickup_code", "")).strip()
    temperature = data.get("temperature_at_collection")
    checklist_verified = data.get("safety_checklist_verified", True)
    pickup_notes = data.get("pickup_notes", "").strip()
    
    if not request_id or not entered_otp:
        return jsonify({"error": "Request ID and 6-digit handover OTP code are required."}), 400
        
    if not checklist_verified:
        return jsonify({"error": "Mandatory safety checklist must be completed prior to handover confirmation."}), 400
        
    try:
        temp_val = float(temperature) if temperature is not None and str(temperature).strip() != "" else None
    except ValueError:
        return jsonify({"error": "Invalid temperature value."}), 400
        
    with db.session.begin_nested():
        req = DonationRequest.query.with_for_update().get(request_id)
        if not req:
            return jsonify({"error": "Claim request not found."}), 404
            
        donation = Donation.query.with_for_update().get(req.donation_id)
        
        # Only donor or receiver associated with this request or admin can verify
        if user.id not in [donation.donor_id, req.receiver_id] and user.role != "ADMIN":
            return jsonify({"error": "You are not authorized to confirm this pickup."}), 403
            
        if req.status != "APPROVED":
            return jsonify({"error": f"Cannot complete pickup. Request status is '{req.status}' (must be APPROVED)."}), 400
            
        # Verify OTP code
        if req.pickup_code != entered_otp:
            return jsonify({"error": "Invalid pickup verification code. Please check the 6-digit OTP displayed on the receiver's dashboard."}), 400
            
        # Prevent duplicate pickup records
        if req.pickup_record:
            return jsonify({"error": "Pickup has already been verified and recorded."}), 409
            
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
            collected_at=datetime.datetime.utcnow()
        )
        db.session.add(pickup_record)
        
    db.session.commit()
    
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
    user = User.query.get(user_id)
    
    if user.role == "RECEIVER":
        records = PickupRecord.query.filter_by(receiver_id=user.id).order_by(PickupRecord.collected_at.desc()).all()
    elif user.role == "DONOR":
        records = PickupRecord.query.filter_by(donor_id=user.id).order_by(PickupRecord.collected_at.desc()).all()
    else:
        records = PickupRecord.query.order_by(PickupRecord.collected_at.desc()).limit(100).all()
        
    return jsonify({"pickups": [p.to_dict() for p in records]}), 200
