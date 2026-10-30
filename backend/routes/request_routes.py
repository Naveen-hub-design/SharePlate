import secrets
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.models.donation import Donation
from backend.models.donation_request import DonationRequest
from backend.services.notification_service import NotificationService
from backend.services.audit_service import AuditService
from backend.utils.decorators import role_required, verified_organization_required
from backend.utils.time_utils import utc_now

request_bp = Blueprint("requests", __name__, url_prefix="/api/v1/requests")

def generate_secure_otp() -> str:
    """Generates a cryptographically secure 6-digit handover OTP."""
    return f"{secrets.randbelow(900000) + 100000}"

@request_bp.route("/donations/<int:donation_id>", methods=["POST"])
@jwt_required()
@role_required("RECEIVER")
@verified_organization_required()
def create_donation_request(donation_id: int):
    """
    Receiver requests to claim all or partial portions of an available donation.
    Enforces atomic checking of remaining portions using database transactions with row-level locking.
    """
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    org = user.organization
    if not org:
        return jsonify({"error": "No recipient organization found for user"}), 400
    
    data = request.get_json() or {}
    requested_portions = data.get("requested_portions") or data.get("requested_quantity")
    request_notes = (data.get("request_notes") or data.get("requester_notes") or "").strip()
    
    if not requested_portions or int(requested_portions) <= 0:
        return jsonify({"error": "Requested portions must be a positive integer."}), 400
    requested_portions = int(requested_portions)
    
    # Atomic transaction with row locking
    try:
        donation = db.session.get(Donation, donation_id, with_for_update=True)
        if not donation:
            db.session.rollback()
            return jsonify({"error": "Donation not found"}), 404
            
        if donation.status != "PUBLISHED":
            db.session.rollback()
            return jsonify({"error": f"Cannot claim this donation. Status is '{donation.status}'."}), 400
            
        if donation.is_expired:
            donation.status = "EXPIRED"
            db.session.commit()
            return jsonify({"error": "This donation collection window has expired."}), 400
            
        if requested_portions > donation.remaining_portions:
            db.session.rollback()
            return jsonify({
                "error": f"Requested portions ({requested_portions}) exceed remaining available portions ({donation.remaining_portions})."
            }), 400
            
        # Prevent duplicate pending requests from same receiver
        existing_pending = DonationRequest.query.filter_by(
            donation_id=donation.id,
            receiver_id=user.id,
            status="PENDING"
        ).first()
        if existing_pending:
            db.session.rollback()
            return jsonify({"error": "You already have a pending request for this donation."}), 409
            
        donation_req = DonationRequest(
            donation_id=donation.id,
            receiver_id=user.id,
            receiver_organization_id=org.id,
            requested_portions=requested_portions,
            status="PENDING",
            request_notes=request_notes,
            collection_deadline=donation.collection_deadline
        )
        db.session.add(donation_req)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e
    
    # Notify donor
    NotificationService.send_notification(
        user_id=donation.donor_id,
        title="New Food Claim Request",
        message=f"{org.name} requested {requested_portions} portions of '{donation.title}'.",
        notif_type="REQUEST",
        link=f"/dashboard/donations/{donation.id}"
    )
    
    AuditService.log_event(
        "REQUEST_CREATED",
        "DonationRequest",
        donation_req.id,
        user.id,
        {"portions": requested_portions, "donation_id": donation.id}
    )
    
    return jsonify({
        "message": "Donation claim request submitted successfully. Awaiting donor approval.",
        "request": donation_req.to_dict()
    }), 201

@request_bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_requests():
    """Returns requests for the logged-in receiver or donor."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if user.role == "RECEIVER":
        requests_list = DonationRequest.query.filter_by(receiver_id=user.id).order_by(DonationRequest.created_at.desc()).all()
    else:
        # Donor views incoming requests for their donations
        requests_list = (
            DonationRequest.query.join(Donation)
            .filter(Donation.donor_id == user.id)
            .order_by(DonationRequest.created_at.desc())
            .all()
        )
        
    return jsonify({"requests": [r.to_dict() for r in requests_list]}), 200

@request_bp.route("/donor", methods=["GET"])
@jwt_required()
@role_required("DONOR", "ADMIN")
def get_donor_requests():
    """Donor-only incoming requests for their active or past donations."""
    user_id = int(get_jwt_identity())
    requests_list = (
        DonationRequest.query.join(Donation)
        .filter(Donation.donor_id == user_id)
        .order_by(DonationRequest.created_at.desc())
        .all()
    )
    return jsonify({"requests": [r.to_dict() for r in requests_list]}), 200

@request_bp.route("/receiver", methods=["GET"])
@jwt_required()
@role_required("RECEIVER", "ADMIN")
def get_receiver_requests():
    """Receiver-only claims and reservation requests."""
    user_id = int(get_jwt_identity())
    requests_list = DonationRequest.query.filter_by(receiver_id=user_id).order_by(DonationRequest.created_at.desc()).all()
    return jsonify({"requests": [r.to_dict() for r in requests_list]}), 200

@request_bp.route("/<int:request_id>/approve", methods=["POST"])
@jwt_required()
@role_required("DONOR", "ADMIN")
def approve_request(request_id: int):
    """
    Donor approves request. Transactionally locks donation, reserves portions,
    generates secure 6-digit handover OTP, and notifies receiver.
    """
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    try:
        req = db.session.get(DonationRequest, request_id, with_for_update=True)
        if not req:
            db.session.rollback()
            return jsonify({"error": "Request not found."}), 404
            
        donation = db.session.get(Donation, req.donation_id, with_for_update=True)
        if not donation:
            db.session.rollback()
            return jsonify({"error": "Associated donation not found."}), 404
            
        if donation.donor_id != user.id and user.role != "ADMIN":
            db.session.rollback()
            return jsonify({"error": "Forbidden: You are not the donor for this donation."}), 403
            
        if req.status != "PENDING":
            db.session.rollback()
            return jsonify({"error": f"Cannot approve request with status '{req.status}'."}), 400
            
        if donation.is_expired:
            donation.status = "EXPIRED"
            req.status = "REJECTED"
            req.rejection_reason = "Donation expired before approval."
            db.session.commit()
            return jsonify({"error": "Donation collection deadline has passed."}), 400
            
        if req.requested_portions > donation.remaining_portions:
            db.session.rollback()
            return jsonify({
                "error": f"Cannot approve: requested portions ({req.requested_portions}) exceed remaining available portions ({donation.remaining_portions})."
            }), 400
            
        # Deduct from available, add to reserved
        donation.reserved_portions += req.requested_portions
        if donation.remaining_portions == 0:
            donation.status = "RESERVED"
            
        pickup_code = generate_secure_otp()
        req.status = "APPROVED"
        req.pickup_code = pickup_code
        req.approved_at = utc_now()
        req.approved_by = user.id
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e
    
    # Notify receiver
    NotificationService.send_notification(
        user_id=req.receiver_id,
        title="Donation Request Approved!",
        message=f"Your request for {req.requested_portions} portions of '{donation.title}' is approved. Your Handover Pickup OTP is {pickup_code}.",
        notif_type="APPROVAL",
        link=f"/dashboard/pickups"
    )
    
    AuditService.log_event(
        "REQUEST_APPROVED",
        "DonationRequest",
        req.id,
        user.id,
        {"portions": req.requested_portions, "pickup_code": pickup_code}
    )
    
    return jsonify({
        "message": "Request approved. Secure handover OTP generated for receiver.",
        "request": req.to_dict()
    }), 200

@request_bp.route("/<int:request_id>/reject", methods=["POST"])
@jwt_required()
@role_required("DONOR", "ADMIN")
def reject_request(request_id: int):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.get_json(silent=True) or {}
    reason = data.get("rejection_reason", "Unable to fulfill this request.").strip()
    
    req = db.session.get(DonationRequest, request_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404
        
    donation = db.session.get(Donation, req.donation_id)
    if not donation:
        return jsonify({"error": "Associated donation not found"}), 404
        
    if donation.donor_id != user.id and user.role != "ADMIN":
        return jsonify({"error": "Forbidden: You are not the donor for this listing."}), 403
        
    if req.status != "PENDING":
        return jsonify({"error": f"Cannot reject request with status '{req.status}'."}), 400
        
    req.status = "REJECTED"
    req.rejection_reason = reason
    db.session.commit()
    
    NotificationService.send_notification(
        user_id=req.receiver_id,
        title="Donation Request Declined",
        message=f"Your claim request for '{donation.title}' was declined: {reason}",
        notif_type="REJECTION",
        link="/dashboard/discover"
    )
    
    AuditService.log_event("REQUEST_REJECTED", "DonationRequest", req.id, user.id, {"reason": reason})
    
    return jsonify({
        "message": "Request rejected",
        "request": req.to_dict()
    }), 200

@request_bp.route("/<int:request_id>/cancel", methods=["POST"])
@jwt_required()
def cancel_request(request_id: int):
    """
    Cancels a pending or approved claim request.
    If already approved, transactionally returns reserved portions to remaining available pool.
    """
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    with db.session.begin_nested():
        req = db.session.get(DonationRequest, request_id, with_for_update=True)
        if not req:
            return jsonify({"error": "Request not found"}), 404
            
        if req.receiver_id != user.id and user.role != "ADMIN":
            return jsonify({"error": "Forbidden"}), 403
            
        if req.status not in ["PENDING", "APPROVED"]:
            return jsonify({"error": f"Cannot cancel request with status '{req.status}'."}), 400
            
        donation = db.session.get(Donation, req.donation_id, with_for_update=True)
        if not donation:
            return jsonify({"error": "Associated donation not found"}), 404
        
        if req.status == "APPROVED":
            # Release reservation back to available portions
            donation.reserved_portions = max(0, donation.reserved_portions - req.requested_portions)
            if donation.status == "RESERVED" and donation.remaining_portions > 0:
                donation.status = "PUBLISHED"
                
        req.status = "CANCELLED"
        
    db.session.commit()
    
    # Notify donor
    NotificationService.send_notification(
        user_id=donation.donor_id,
        title="Claim Request Cancelled",
        message=f"Claim request for {req.requested_portions} portions of '{donation.title}' was cancelled by receiver.",
        notif_type="DEADLINE",
        link=f"/dashboard/donations/{donation.id}"
    )
    
    AuditService.log_event("REQUEST_CANCELLED", "DonationRequest", req.id, user.id)
    
    return jsonify({
        "message": "Request cancelled successfully and reserved portions returned to available pool.",
        "request": req.to_dict()
    }), 200
