import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.user import User
from backend.models.donation import Donation
from backend.services.ai_service import AIServiceAdapter
from backend.services.matching_service import MatchingService
from backend.utils.file_storage import save_uploaded_file

ai_bp = Blueprint("ai", __name__, url_prefix="/api/v1/ai")

@ai_bp.route("/analyze-photo", methods=["POST"])
@jwt_required()
def analyze_food_photo():
    """
    Capability A: Food Photo Assistant.
    Accepts an uploaded food photo or an existing photo_url/image_url and returns
    AI suggested title, description, category, storage, and visual tags.
    """
    user_hint = request.form.get("hint", "") or (request.json.get("hint", "") if request.is_json else "")
    temp_file_path = None
    photo_url = None
    
    file = request.files.get("photo") or request.files.get("file") or request.files.get("image")
    if file:
        try:
            rel_url = save_uploaded_file(file, subfolder="food")
            filename = os.path.basename(rel_url)
            temp_file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], "food", filename)
            photo_url = rel_url
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
    elif request.is_json and ("photo_url" in request.json or "image_url" in request.json):
        photo_url = request.json.get("photo_url") or request.json.get("image_url")
        filename = os.path.basename(photo_url)
        temp_file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], "food", filename)
        if not os.path.exists(temp_file_path):
            temp_file_path = None
    else:
        return jsonify({"error": "No food image provided. Upload a file under 'photo' or provide 'photo_url'/'image_url'."}), 400
        
    if not temp_file_path or not os.path.exists(temp_file_path):
        # Fallback to analyzing hint or generic descriptor
        result = AIServiceAdapter._analyze_photo_deterministic("food_sample.jpg", user_hint=user_hint)
        result["photo_url"] = photo_url if 'photo_url' in locals() else None
        return jsonify(result), 200
        
    analysis = AIServiceAdapter.analyze_food_photo(temp_file_path, user_hint=user_hint)
    analysis["photo_url"] = photo_url
    return jsonify(analysis), 200

@ai_bp.route("/listing-assistant", methods=["POST"])
@jwt_required()
def listing_assistant():
    """
    Capability C: Listing Assistant.
    Evaluates a draft listing for missing mandatory fields, collection logistics,
    and FSSAI shelf life rules without inventing facts.
    """
    draft_data = request.get_json() or {}
    assistance = AIServiceAdapter.generate_listing_assistance(draft_data)
    return jsonify(assistance), 200

@ai_bp.route("/explain-match", methods=["POST"])
@jwt_required()
def explain_match():
    """
    Capability B: Donation Matching Assistant.
    Explains in clear terms why a donation suits the receiver organization.
    """
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    org = user.organization
    
    if not org:
        return jsonify({"error": "No receiver organization profile found."}), 400
        
    data = request.get_json() or {}
    donation_id = data.get("donation_id")
    if not donation_id:
        return jsonify({"error": "donation_id is required."}), 400
        
    donation = db.session.get(Donation, int(donation_id))
    if not donation:
        return jsonify({"error": "Donation not found."}), 404
        
    match_score_meta = MatchingService.calculate_match_score(donation, org)
    if not match_score_meta:
        return jsonify({
            "eligible": False,
            "message": "This donation is currently not an eligible match based on verification, distance, or deadline constraints."
        }), 200
        
    explanation = AIServiceAdapter.explain_donation_match(
        donation.to_dict(),
        org.to_dict(),
        match_score_meta
    )
    return jsonify({"eligible": True, **explanation}), 200
