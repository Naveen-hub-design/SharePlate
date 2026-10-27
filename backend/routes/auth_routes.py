import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.models.organization import Organization
from backend.services.audit_service import AuditService

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    phone = data.get("phone", "").strip()
    role = data.get("role", "DONOR").upper()
    
    # Validation
    if not email or not re.match(EMAIL_REGEX, email):
        return jsonify({"error": "Valid email address is required"}), 400
        
    if not password or len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long"}), 400
        
    if not full_name:
        return jsonify({"error": "Full name is required"}), 400
        
    if role not in ["DONOR", "RECEIVER"]:
        # Disallow self-registration as ADMIN
        return jsonify({"error": "Role must be DONOR or RECEIVER"}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409
        
    # Organization details
    org_data = data.get("organization") or {}
    org_name = org_data.get("name", "").strip()
    org_type = org_data.get("type", "").strip()
    org_address = org_data.get("address", "").strip()
    org_city = org_data.get("city", "").strip()
    org_state = org_data.get("state", "").strip()
    org_postal_code = org_data.get("postal_code", "").strip()
    
    if not org_name or not org_address or not org_city:
        return jsonify({"error": "Organization name, address, and city are required"}), 400
        
    # Create user
    user = User(
        email=email,
        full_name=full_name,
        phone=phone,
        role=role,
        status="ACTIVE"
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush() # get user.id
    
    # Create organization
    org = Organization(
        user_id=user.id,
        name=org_name,
        type=org_type or ("RESTAURANT" if role == "DONOR" else "COMMUNITY_KITCHEN"),
        registration_number=org_data.get("registration_number", "").strip(),
        fssai_license=org_data.get("fssai_license", "").strip(),
        contact_person=full_name,
        contact_email=email,
        contact_phone=phone,
        address=org_address,
        city=org_city,
        state=org_state or "State",
        postal_code=org_postal_code or "000000",
        latitude=float(org_data.get("latitude")) if org_data.get("latitude") is not None else None,
        longitude=float(org_data.get("longitude")) if org_data.get("longitude") is not None else None,
        verification_status="PENDING", # Needs admin verification
        capacity_info=org_data.get("capacity_info") or {"servings_per_day": 100}
    )
    db.session.add(org)
    db.session.commit()
    
    AuditService.log_event("USER_REGISTERED", "User", user.id, user.id, {"role": role, "org_name": org_name})
    
    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "message": "Registration successful. Organization submitted for verification.",
        "access_token": access_token,
        "user": user.to_dict()
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401
        
    if user.status != "ACTIVE":
        return jsonify({"error": "Account is suspended. Please contact platform administration."}), 403
        
    access_token = create_access_token(identity=str(user.id))
    AuditService.log_event("USER_LOGIN", "User", user.id, user.id)
    
    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": user.to_dict()
    }), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({"user": user.to_dict()}), 200

@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    data = request.get_json() or {}
    if "full_name" in data and data["full_name"].strip():
        user.full_name = data["full_name"].strip()
    if "phone" in data:
        user.phone = data["phone"].strip()
        
    db.session.commit()
    return jsonify({"message": "Profile updated", "user": user.to_dict()}), 200
