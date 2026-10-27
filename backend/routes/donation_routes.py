import datetime
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.models.organization import Organization
from backend.models.donation import Donation
from backend.services.food_safety_service import FoodSafetyService
from backend.services.matching_service import haversine_distance_km
from backend.services.audit_service import AuditService
from backend.utils.decorators import role_required, verified_organization_required
from backend.utils.file_storage import save_uploaded_file

donation_bp = Blueprint("donations", __name__, url_prefix="/api/v1/donations")

def parse_iso_datetime(dt_str):
    if not dt_str:
        return None
    try:
        # replace Z with +00:00 for fromisoformat compatibility
        return datetime.datetime.fromisoformat(dt_str.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return None

def auto_expire_stale_donations():
    """Helper to automatically transition past-deadline published donations to EXPIRED."""
    now = datetime.datetime.utcnow()
    stale_donations = Donation.query.filter(
        Donation.status.in_(["PUBLISHED", "DRAFT"]),
        Donation.collection_deadline < now
    ).all()
    for d in stale_donations:
        d.status = "EXPIRED"
    if stale_donations:
        db.session.commit()

@donation_bp.route("", methods=["POST"])
@jwt_required()
@role_required("DONOR", "ADMIN")
def create_donation():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    org = user.organization
    
    if not org:
        return jsonify({"error": "No organization profile associated with this donor account"}), 400
        
    data = request.get_json() or {}
    
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    category = data.get("category", "").strip().upper()
    quantity = data.get("quantity")
    unit = data.get("unit", "portions").strip()
    total_portions = data.get("total_portions")
    
    if not title or not description or not category or quantity is None:
        return jsonify({"error": "Title, description, category, and quantity are required."}), 400
        
    try:
        quantity = float(quantity)
        total_portions = int(total_portions) if total_portions else int(quantity)
        if quantity <= 0 or total_portions <= 0:
            raise ValueError()
    except (ValueError, TypeError):
        return jsonify({"error": "Quantity and total portions must be positive numbers."}), 400
        
    prep_time = parse_iso_datetime(data.get("preparation_time"))
    packaging_time = parse_iso_datetime(data.get("packaging_time"))
    available_from = parse_iso_datetime(data.get("available_from")) or datetime.datetime.utcnow()
    deadline = parse_iso_datetime(data.get("collection_deadline"))
    storage = data.get("storage_conditions", "AMBIENT").strip().upper()
    allergens = data.get("allergens") or []
    
    # Run FSSAI Safety Validation
    is_safe, safety_errors, safety_warnings = FoodSafetyService.validate_donation_safety(
        category=category,
        storage_conditions=storage,
        preparation_time=prep_time,
        collection_deadline=deadline,
        available_from=available_from,
        allergens=allergens
    )
    
    if not is_safe:
        return jsonify({
            "error": "Food safety validation failed",
            "safety_errors": safety_errors,
            "safety_warnings": safety_warnings
        }), 400
        
    target_status = data.get("status", "PUBLISHED").strip().upper()
    if target_status not in ["DRAFT", "PUBLISHED"]:
        target_status = "PUBLISHED"
        
    # Mandatory Rule: Unverified donors must not publish public donation listings until verification is complete
    if target_status == "PUBLISHED" and user.role != "ADMIN":
        if org.verification_status != "VERIFIED":
            return jsonify({
                "error": "Unverified donors cannot publish public donation listings. You may save this listing as DRAFT until platform admin verification is complete.",
                "verification_status": org.verification_status
            }), 403
            
    collection_address = data.get("collection_address", org.address).strip()
    latitude = float(data.get("latitude")) if data.get("latitude") is not None else org.latitude
    longitude = float(data.get("longitude")) if data.get("longitude") is not None else org.longitude
    phone = data.get("donor_contact_phone", org.contact_phone or user.phone or "").strip()
    
    if not phone:
        return jsonify({"error": "A donor contact phone number is required for pickup coordination."}), 400
        
    donation = Donation(
        donor_id=user.id,
        organization_id=org.id,
        title=title,
        description=description,
        category=category,
        photo_url=data.get("photo_url"),
        quantity=quantity,
        unit=unit,
        total_portions=total_portions,
        reserved_portions=0,
        collected_portions=0,
        preparation_time=prep_time,
        packaging_time=packaging_time,
        available_from=available_from,
        collection_deadline=deadline,
        allergens=allergens,
        storage_conditions=storage,
        food_safety_notes=data.get("food_safety_notes", "").strip(),
        donor_contact_phone=phone,
        collection_address=collection_address,
        latitude=latitude,
        longitude=longitude,
        status=target_status
    )
    
    db.session.add(donation)
    db.session.commit()
    
    AuditService.log_event(
        "DONATION_CREATED",
        "Donation",
        donation.id,
        user.id,
        {"status": target_status, "category": category, "portions": total_portions}
    )
    
    return jsonify({
        "message": f"Donation listing created successfully with status '{target_status}'.",
        "donation": donation.to_dict(),
        "safety_warnings": safety_warnings
    }), 201

@donation_bp.route("", methods=["GET"])
def discover_donations():
    """
    Public and Receiver discovery endpoint.
    Filters: category, city, storage_conditions, status, search.
    Calculates distance if client coordinates provided.
    """
    auto_expire_stale_donations()
    
    category = request.args.get("category")
    city = request.args.get("city")
    storage = request.args.get("storage")
    status = request.args.get("status", "PUBLISHED")
    search = request.args.get("search", "").strip()
    donor_id = request.args.get("donor_id")
    
    user_lat = request.args.get("lat", type=float)
    user_lng = request.args.get("lng", type=float)
    max_km = request.args.get("max_km", type=float)
    
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    
    query = Donation.query
    
    if donor_id:
        query = query.filter(Donation.donor_id == int(donor_id))
    elif status != "ALL":
        query = query.filter(Donation.status == status)
        
    if category:
        query = query.filter(Donation.category == category.upper())
        
    if storage:
        query = query.filter(Donation.storage_conditions == storage.upper())
        
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            db.or_(
                Donation.title.ilike(search_fmt),
                Donation.description.ilike(search_fmt),
                Donation.collection_address.ilike(search_fmt)
            )
        )
        
    # Order by urgency (closest deadline first for published listings)
    if status == "PUBLISHED":
        query = query.order_by(Donation.collection_deadline.asc())
    else:
        query = query.order_by(Donation.created_at.desc())
        
    donations = query.all()
    results = []
    
    for d in donations:
        d_dict = d.to_dict()
        distance = None
        if user_lat is not None and user_lng is not None and d.latitude is not None and d.longitude is not None:
            distance = haversine_distance_km(user_lat, user_lng, d.latitude, d.longitude)
            if max_km is not None and distance > max_km:
                continue
        d_dict["distance_km"] = distance
        results.append(d_dict)
        
    # In-memory distance sort if coordinates given
    if user_lat is not None and user_lng is not None:
        results.sort(key=lambda x: x["distance_km"] if x["distance_km"] is not None else 999999)
        
    total_count = len(results)
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated = results[start_idx:end_idx]
    
    return jsonify({
        "donations": paginated,
        "total": total_count,
        "page": page,
        "per_page": per_page,
        "total_pages": (total_count + per_page - 1) // per_page
    }), 200

@donation_bp.route("/<int:donation_id>", methods=["GET"])
def get_donation_detail(donation_id: int):
    auto_expire_stale_donations()
    donation = Donation.query.get(donation_id)
    if not donation:
        return jsonify({"error": "Donation listing not found"}), 404
        
    data = donation.to_dict()
    data["pre_collection_safety_checklist"] = FoodSafetyService.get_pre_collection_safety_checklist(
        donation.category,
        donation.storage_conditions
    )
    return jsonify({"donation": data}), 200

@donation_bp.route("/<int:donation_id>", methods=["PUT"])
@jwt_required()
def update_donation(donation_id: int):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    donation = Donation.query.get(donation_id)
    
    if not donation:
        return jsonify({"error": "Donation not found"}), 404
        
    if donation.donor_id != user_id and user.role != "ADMIN":
        return jsonify({"error": "You do not have permission to edit this donation."}), 403
        
    if donation.reserved_portions > 0 or donation.collected_portions > 0:
        return jsonify({"error": "Cannot edit a donation that has active claims or collections."}), 400
        
    data = request.get_json() or {}
    
    if "title" in data:
        donation.title = data["title"].strip()
    if "description" in data:
        donation.description = data["description"].strip()
    if "food_safety_notes" in data:
        donation.food_safety_notes = data["food_safety_notes"].strip()
    if "collection_address" in data:
        donation.collection_address = data["collection_address"].strip()
    if "donor_contact_phone" in data:
        donation.donor_contact_phone = data["donor_contact_phone"].strip()
    if "photo_url" in data:
        donation.photo_url = data["photo_url"]
    if "allergens" in data:
        donation.allergens = data["allergens"]
        
    db.session.commit()
    AuditService.log_event("DONATION_UPDATED", "Donation", donation.id, user_id)
    
    return jsonify({
        "message": "Donation updated successfully",
        "donation": donation.to_dict()
    }), 200

@donation_bp.route("/<int:donation_id>/publish", methods=["POST"])
@jwt_required()
@verified_organization_required()
def publish_donation(donation_id: int):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    donation = Donation.query.get(donation_id)
    
    if not donation:
        return jsonify({"error": "Donation not found"}), 404
        
    if donation.donor_id != user_id and user.role != "ADMIN":
        return jsonify({"error": "Forbidden"}), 403
        
    if donation.is_expired:
        return jsonify({"error": "Cannot publish an expired donation. Please update the collection deadline."}), 400
        
    donation.status = "PUBLISHED"
    db.session.commit()
    AuditService.log_event("DONATION_PUBLISHED", "Donation", donation.id, user_id)
    
    return jsonify({
        "message": "Donation listing published successfully",
        "donation": donation.to_dict()
    }), 200

@donation_bp.route("/<int:donation_id>/withdraw", methods=["POST"])
@jwt_required()
def withdraw_donation(donation_id: int):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    donation = Donation.query.get(donation_id)
    
    if not donation:
        return jsonify({"error": "Donation not found"}), 404
        
    if donation.donor_id != user_id and user.role != "ADMIN":
        return jsonify({"error": "Forbidden"}), 403
        
    if donation.reserved_portions > 0:
        return jsonify({"error": "Cannot withdraw a donation that currently has reserved portions. Please resolve pending requests first."}), 400
        
    donation.status = "WITHDRAWN"
    db.session.commit()
    AuditService.log_event("DONATION_WITHDRAWN", "Donation", donation.id, user_id)
    
    return jsonify({
        "message": "Donation withdrawn successfully",
        "donation": donation.to_dict()
    }), 200

@donation_bp.route("/upload-image", methods=["POST"])
@jwt_required()
def upload_image():
    if "photo" not in request.files:
        return jsonify({"error": "No file attached under 'photo' field"}), 400
        
    file = request.files["photo"]
    try:
        url = save_uploaded_file(file, subfolder="food")
        return jsonify({"message": "File uploaded successfully", "photo_url": url}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Upload failed", "details": str(e)}), 500
