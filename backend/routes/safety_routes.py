from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.models.donation import Donation
from backend.models.safety_report import SafetyReport
from backend.services.food_safety_service import FoodSafetyService
from backend.services.audit_service import AuditService

safety_bp = Blueprint("safety", __name__, url_prefix="/api/v1/safety")

@safety_bp.route("/reports", methods=["POST"])
@jwt_required()
def create_safety_report():
    """
    Submits a food safety issue report or hygiene violation complaint.
    Automatically flags the related donation or organization for administrator review.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    
    issue_type = data.get("issue_type", "OTHER").strip().upper()
    description = data.get("description", "").strip()
    donation_id = data.get("donation_id")
    reported_org_id = data.get("reported_organization_id")
    evidence_urls = data.get("evidence_urls") or []
    
    if not description:
        return jsonify({"error": "A detailed description of the food safety concern is required."}), 400
        
    donation = None
    if donation_id:
        donation = db.session.get(Donation, int(donation_id))
        if donation and not reported_org_id:
            reported_org_id = donation.organization_id
            
    report = SafetyReport(
        reporter_id=user_id,
        donation_id=donation.id if donation else None,
        reported_organization_id=reported_org_id,
        issue_type=issue_type,
        description=description,
        evidence_urls=evidence_urls,
        status="OPEN"
    )
    db.session.add(report)
    db.session.commit()
    
    AuditService.log_event(
        "SAFETY_REPORT_FILED",
        "SafetyReport",
        report.id,
        user_id,
        {"issue_type": issue_type, "donation_id": donation_id}
    )
    
    return jsonify({
        "message": "Food safety report submitted. Platform safety administrators have been alerted.",
        "report": report.to_dict()
    }), 201

@safety_bp.route("/categories-and-allergens", methods=["GET"])
def get_safety_metadata():
    """Returns official food category safety parameters and standard allergen definitions."""
    return jsonify({
        "categories": FoodSafetyService.get_food_categories(),
        "allergens": FoodSafetyService.get_allergen_catalog(),
        "regulatory_reference": "Food Safety and Standards (Recovery and Distribution of Surplus Food) Regulations, 2019 (FSSAI)"
    }), 200

@safety_bp.route("/checklist", methods=["GET"])
def get_safety_checklist():
    category = request.args.get("category", "COOKED_MEALS")
    storage = request.args.get("storage_conditions", "AMBIENT")
    checklist = FoodSafetyService.get_pre_collection_safety_checklist(category, storage)
    return jsonify({"checklist": checklist}), 200
