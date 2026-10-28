from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.models.organization import Organization
from backend.services.audit_service import AuditService

organization_bp = Blueprint("organizations", __name__, url_prefix="/api/v1/organizations")

@organization_bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_organization():
    user_id = get_jwt_identity()
    org = Organization.query.filter_by(user_id=int(user_id)).first()
    if not org:
        return jsonify({"error": "No organization profile found"}), 404
        
    return jsonify({"organization": org.to_dict()}), 200

@organization_bp.route("/my", methods=["PUT"])
@jwt_required()
def update_my_organization():
    user_id = get_jwt_identity()
    org = Organization.query.filter_by(user_id=int(user_id)).first()
    if not org:
        return jsonify({"error": "No organization profile found"}), 404
        
    data = request.get_json() or {}
    
    # Check if FSSAI license or registration number changed
    original_fssai = org.fssai_license
    new_fssai = data.get("fssai_license", org.fssai_license)
    
    org.name = data.get("name", org.name).strip()
    org.type = data.get("type", org.type)
    org.registration_number = data.get("registration_number", org.registration_number)
    org.fssai_license = new_fssai
    org.contact_person = data.get("contact_person", org.contact_person)
    org.contact_email = data.get("contact_email", org.contact_email)
    org.contact_phone = data.get("contact_phone", org.contact_phone)
    org.address = data.get("address", org.address)
    org.city = data.get("city", org.city)
    org.state = data.get("state", org.state)
    org.postal_code = data.get("postal_code", org.postal_code)
    
    if "latitude" in data:
        org.latitude = float(data["latitude"]) if data["latitude"] is not None else None
    if "longitude" in data:
        org.longitude = float(data["longitude"]) if data["longitude"] is not None else None
        
    if "capacity_info" in data:
        org.capacity_info = data["capacity_info"]
        
    # If FSSAI changed, flag for re-verification if it was previously verified
    if original_fssai != new_fssai and org.verification_status == "VERIFIED":
        org.verification_status = "PENDING"
        org.verification_notes = "License details updated. Pending administrator re-verification."
        
    db.session.commit()
    AuditService.log_event("ORG_UPDATED", "Organization", org.id, int(user_id))
    
    return jsonify({
        "message": "Organization updated successfully",
        "organization": org.to_dict()
    }), 200

@organization_bp.route("/<int:org_id>", methods=["GET"])
def get_public_organization(org_id: int):
    org = db.session.get(Organization, org_id)
    if not org:
        return jsonify({"error": "Organization not found"}), 404
        
    return jsonify({
        "organization": {
            "id": org.id,
            "name": org.name,
            "type": org.type,
            "city": org.city,
            "state": org.state,
            "verification_status": org.verification_status,
            "created_at": org.created_at.isoformat() if org.created_at else None
        }
    }), 200
