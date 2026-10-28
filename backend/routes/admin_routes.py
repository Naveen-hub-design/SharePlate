import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.models.organization import Organization, OrganizationVerificationRecord
from backend.models.donation import Donation
from backend.models.pickup import PickupRecord
from backend.models.safety_report import SafetyReport
from backend.models.audit_log import AuditLog
from backend.services.notification_service import NotificationService
from backend.services.audit_service import AuditService
from backend.utils.decorators import role_required
from backend.utils.time_utils import utc_now

admin_bp = Blueprint("admin", __name__, url_prefix="/api/v1/admin")

@admin_bp.route("/overview", methods=["GET"])
@jwt_required()
@role_required("ADMIN")
def get_admin_overview():
    total_users = User.query.count()
    total_orgs = Organization.query.count()
    pending_verifications = Organization.query.filter_by(verification_status="PENDING").count()
    active_donations = Donation.query.filter_by(status="PUBLISHED").count()
    total_completed_donations = Donation.query.filter_by(status="COMPLETED").count()
    open_safety_reports = SafetyReport.query.filter_by(status="OPEN").count()
    
    # Calculate total portions rescued
    total_portions_collected = db.session.query(db.func.sum(Donation.collected_portions)).scalar() or 0
    
    return jsonify({
        "total_users": total_users,
        "total_organizations": total_orgs,
        "pending_verifications": pending_verifications,
        "active_donations": active_donations,
        "completed_donations": total_completed_donations,
        "open_safety_reports": open_safety_reports,
        "total_portions_collected": int(total_portions_collected)
    }), 200

@admin_bp.route("/verifications", methods=["GET"])
@jwt_required()
@role_required("ADMIN")
def list_pending_verifications():
    status = request.args.get("status", "PENDING")
    query = Organization.query
    if status != "ALL":
        query = query.filter_by(verification_status=status)
    orgs = query.order_by(Organization.created_at.desc()).all()
    return jsonify({"organizations": [o.to_dict() for o in orgs]}), 200

@admin_bp.route("/verifications/<int:org_id>", methods=["POST"])
@jwt_required()
@role_required("ADMIN")
def review_verification(org_id: int):
    reviewer_id = int(get_jwt_identity())
    org = db.session.get(Organization, org_id)
    if not org:
        return jsonify({"error": "Organization not found"}), 404
        
    data = request.get_json() or {}
    raw_decision = (data.get("decision") or data.get("status") or "").strip().upper()
    if raw_decision == "APPROVED":
        raw_decision = "VERIFIED"
    decision = raw_decision
    notes = data.get("notes", "").strip()
    
    if decision not in ["VERIFIED", "REJECTED"]:
        return jsonify({"error": "Decision must be either VERIFIED (or APPROVED) or REJECTED."}), 400
        
    if not notes:
        return jsonify({"error": "Reviewer audit notes are mandatory for compliance."}), 400
        
    prev_status = org.verification_status
    org.verification_status = decision
    org.verification_notes = notes
    
    record = OrganizationVerificationRecord(
        organization_id=org.id,
        reviewer_id=reviewer_id,
        previous_status=prev_status,
        new_status=decision,
        notes=notes
    )
    db.session.add(record)
    db.session.commit()
    
    # Notify organization owner
    NotificationService.send_notification(
        user_id=org.user_id,
        title=f"Organization Status: {decision}",
        message=f"Your organization verification request was reviewed. Status: {decision}. Notes: {notes}",
        notif_type="SYSTEM",
        link="/dashboard/settings"
    )
    
    AuditService.log_event(
        "ORGANIZATION_REVIEWED",
        "Organization",
        org.id,
        reviewer_id,
        {"previous": prev_status, "decision": decision, "notes": notes}
    )
    
    return jsonify({
        "message": f"Organization successfully {decision.lower()}.",
        "organization": org.to_dict()
    }), 200

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@role_required("ADMIN")
def list_users():
    role = request.args.get("role")
    query = User.query
    if role:
        query = query.filter_by(role=role.upper())
    users = query.order_by(User.created_at.desc()).all()
    return jsonify({"users": [u.to_dict() for u in users]}), 200

@admin_bp.route("/users/<int:target_user_id>/status", methods=["PUT"])
@jwt_required()
@role_required("ADMIN")
def update_user_status(target_user_id: int):
    admin_id = int(get_jwt_identity())
    if admin_id == target_user_id:
        return jsonify({"error": "Administrators cannot suspend their own account."}), 400
        
    target = db.session.get(User, target_user_id)
    if not target:
        return jsonify({"error": "User not found"}), 404
        
    data = request.get_json() or {}
    new_status = data.get("status", "").strip().upper()
    reason = data.get("reason", "").strip()
    
    if new_status not in ["ACTIVE", "SUSPENDED"]:
        return jsonify({"error": "Status must be ACTIVE or SUSPENDED."}), 400
        
    target.status = new_status
    db.session.commit()
    
    AuditService.log_event(
        "USER_STATUS_CHANGED",
        "User",
        target.id,
        admin_id,
        {"new_status": new_status, "reason": reason}
    )
    
    return jsonify({
        "message": f"User status updated to {new_status}.",
        "user": target.to_dict()
    }), 200

@admin_bp.route("/safety-reports", methods=["GET"])
@jwt_required()
@role_required("ADMIN")
def list_safety_reports():
    status = request.args.get("status")
    query = SafetyReport.query
    if status and status != "ALL":
        query = query.filter_by(status=status.upper())
    reports = query.order_by(SafetyReport.created_at.desc()).all()
    return jsonify({"safety_reports": [r.to_dict() for r in reports]}), 200

@admin_bp.route("/safety-reports/<int:report_id>", methods=["PUT"])
@jwt_required()
@role_required("ADMIN")
def update_safety_report(report_id: int):
    admin_id = int(get_jwt_identity())
    report = db.session.get(SafetyReport, report_id)
    if not report:
        return jsonify({"error": "Safety report not found"}), 404
        
    data = request.get_json() or {}
    new_status = data.get("status", report.status).strip().upper()
    admin_notes = data.get("admin_notes", "").strip()
    suspend_donation = data.get("suspend_donation", False)
    
    if new_status not in ["OPEN", "UNDER_INVESTIGATION", "RESOLVED", "DISMISSED"]:
        return jsonify({"error": "Invalid safety report status."}), 400
        
    report.status = new_status
    if admin_notes:
        report.admin_notes = admin_notes
    report.resolved_by = admin_id
    report.resolved_at = utc_now()
    
    # If safety issue confirmed, withdraw or suspend related donation
    if suspend_donation and report.donation_id:
        donation = db.session.get(Donation, report.donation_id)
        if donation and donation.status in ["PUBLISHED", "DRAFT"]:
            donation.status = "WITHDRAWN"
            
    db.session.commit()
    AuditService.log_event("SAFETY_REPORT_RESOLVED", "SafetyReport", report.id, admin_id, {"status": new_status})
    
    return jsonify({
        "message": "Safety report updated successfully.",
        "report": report.to_dict()
    }), 200

@admin_bp.route("/audit-logs", methods=["GET"])
@jwt_required()
@role_required("ADMIN")
def list_audit_logs():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)
    entity_type = request.args.get("entity_type")
    
    query = AuditLog.query
    if entity_type:
        query = query.filter_by(entity_type=entity_type)
        
    paginated = query.order_by(AuditLog.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        "logs": [l.to_dict() for l in paginated.items],
        "total": paginated.total,
        "page": page,
        "pages": paginated.pages
    }), 200
