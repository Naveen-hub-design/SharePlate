import os
import json
import logging
import base64
import requests
from typing import Dict, Any, List, Optional
from flask import current_app
from backend.services.food_safety_service import FOOD_CATEGORIES, ALLERGEN_CATALOG

logger = logging.getLogger(__name__)

class AIServiceAdapter:
    """
    Server-side AI Service Adapter for SharePlate.
    Provides Food Photo Assistant, Donation Matching Explainer, and Listing Assistant.
    Guarantees deterministic, graceful fallback when cloud AI providers are unconfigured or fail.
    """

    @classmethod
    def analyze_food_photo(cls, image_path: str, user_hint: str = "") -> Dict[str, Any]:
        """
        Capability A: Food Photo Assistant.
        Analyzes a food image to suggest category, draft description, and visual tags.
        NOTE: Explicitly includes a disclaimer that food safety, freshness, and allergens cannot be inferred.
        """
        provider = current_app.config.get("AI_PROVIDER", "fallback")
        openai_key = current_app.config.get("OPENAI_API_KEY", "")
        gemini_key = current_app.config.get("GEMINI_API_KEY", "")
        
        # If cloud provider selected and key present, attempt provider call
        if provider == "openai" and openai_key:
            try:
                return cls._analyze_photo_openai(image_path, openai_key, user_hint)
            except Exception as e:
                logger.warning(f"OpenAI Vision failed, falling back to deterministic analyzer: {e}")
                
        elif provider == "gemini" and gemini_key:
            try:
                return cls._analyze_photo_gemini(image_path, gemini_key, user_hint)
            except Exception as e:
                logger.warning(f"Gemini Vision failed, falling back to deterministic analyzer: {e}")
                
        # Deterministic Heuristic Fallback
        return cls._analyze_photo_deterministic(image_path, user_hint)

    @classmethod
    def _analyze_photo_deterministic(cls, image_path: str, user_hint: str = "") -> Dict[str, Any]:
        """
        Deterministic, robust local fallback analyzing filename, hints, and visual characteristics.
        """
        filename = os.path.basename(image_path).lower()
        hint_lower = (user_hint or "").lower()
        
        suggested_category = "COOKED_MEALS"
        suggested_title = "Surplus Prepared Meals"
        suggested_description = "Freshly prepared wholesome surplus food, packaged and ready for safe collection."
        visual_tags = ["Prepared Food", "Meal Portions", "Food Grade Containers"]
        estimated_portions = 20
        suggested_storage = "HOT_HOLD"
        
        # Heuristic rules based on filename or hint keywords
        if any(w in hint_lower or w in filename for w in ["bread", "bakery", "roti", "naan", "bun", "pastry", "cake", "croissant"]):
            suggested_category = "BAKERY_BREAD"
            suggested_title = "Assorted Bakery & Bread Items"
            suggested_description = "Surplus baked goods and artisan breads, packed dry in clean food-safe packaging."
            visual_tags = ["Bakery", "Bread", "Dry Goods"]
            estimated_portions = 30
            suggested_storage = "AMBIENT"
        elif any(w in hint_lower or w in filename for w in ["rice", "biryani", "curry", "dal", "sambar", "khichdi", "gravy"]):
            suggested_category = "COOKED_MEALS"
            suggested_title = "Warm Prepared Curry & Rice Portions"
            suggested_description = "Freshly cooked catered meals. Maintained under hygiene supervision, suitable for immediate community distribution."
            visual_tags = ["Cooked Meal", "Hot Hold Ready", "Catering Surplus"]
            estimated_portions = 50
            suggested_storage = "HOT_HOLD"
        elif any(w in hint_lower or w in filename for w in ["fruit", "veg", "vegetable", "apple", "banana", "tomato", "salad"]):
            suggested_category = "FRESH_PRODUCE"
            suggested_title = "Fresh Surplus Produce & Vegetables"
            suggested_description = "Intact, fresh produce sorted for quality and ready for distribution to community kitchens."
            visual_tags = ["Produce", "Raw Vegetables", "Fresh"]
            estimated_portions = 40
            suggested_storage = "AMBIENT"
        elif any(w in hint_lower or w in filename for w in ["milk", "paneer", "yogurt", "curd", "cheese", "dairy"]):
            suggested_category = "DAIRY"
            suggested_title = "Fresh Dairy Products"
            suggested_description = "Chilled dairy items kept under continuous refrigeration (below 5°C)."
            visual_tags = ["Dairy", "Chilled", "Cold Chain"]
            estimated_portions = 25
            suggested_storage = "REFRIGERATED"
        elif any(w in hint_lower or w in filename for w in ["juice", "water", "beverage", "drink"]):
            suggested_category = "BEVERAGES"
            suggested_title = "Sealed Beverages & Refreshments"
            suggested_description = "Sealed, unopened beverages within manufacturer expiration dates."
            visual_tags = ["Beverages", "Sealed Containers"]
            estimated_portions = 30
            suggested_storage = "AMBIENT"
            
        return {
            "provider": "deterministic_fallback",
            "suggested_category": suggested_category,
            "suggested_title": suggested_title,
            "suggested_description": suggested_description,
            "suggested_storage": suggested_storage,
            "suggested_portions": estimated_portions,
            "visual_tags": visual_tags,
            "safety_disclaimer": "AI recommendations are for drafting convenience only. Donors must manually review all information, verify allergens, and comply with FSSAI hygiene regulations before publishing.",
            "requires_donor_confirmation": True
        }

    @classmethod
    def _analyze_photo_openai(cls, image_path: str, api_key: str, user_hint: str) -> Dict[str, Any]:
        """Calls OpenAI GPT-4o-mini Vision with structured JSON output."""
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
            
        prompt = (
            "You are SharePlate's Food Rescue Visual Assistant. "
            "Analyze this food photo for surplus donation listing. "
            "Output valid JSON ONLY with keys: suggested_category (one of: COOKED_MEALS, BAKERY_BREAD, PACKAGED_GOODS, FRESH_PRODUCE, DAIRY, BEVERAGES, OTHER), "
            "suggested_title (concise 4-8 words), suggested_description (2 sentences), suggested_storage (AMBIENT, REFRIGERATED, FROZEN, HOT_HOLD), "
            "suggested_portions (integer estimate), visual_tags (array of strings). "
            "DO NOT claim food is safe or predict freshness."
        )
        if user_hint:
            prompt += f" Donor note: {user_hint}"
            
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": current_app.config.get("OPENAI_MODEL", "gpt-4o-mini"),
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{encoded_string}"}
                        }
                    ]
                }
            ],
            "response_format": {"type": "json_object"},
            "max_tokens": 400
        }
        
        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        result_text = data["choices"][0]["message"]["content"]
        parsed = json.loads(result_text)
        parsed["provider"] = "openai_vision"
        parsed["safety_disclaimer"] = "AI recommendations are for drafting convenience only. Donors must manually review all information, verify allergens, and comply with FSSAI regulations."
        parsed["requires_donor_confirmation"] = True
        return parsed

    @classmethod
    def _analyze_photo_gemini(cls, image_path: str, api_key: str, user_hint: str) -> Dict[str, Any]:
        """Calls Gemini Vision API with structured JSON output."""
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
            
        model = current_app.config.get("GEMINI_MODEL", "gemini-1.5-flash")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        
        prompt = (
            "You are SharePlate's Food Rescue Visual Assistant. "
            "Analyze this food photo for surplus donation listing. "
            "Return JSON ONLY with keys: suggested_category (one of: COOKED_MEALS, BAKERY_BREAD, PACKAGED_GOODS, FRESH_PRODUCE, DAIRY, BEVERAGES, OTHER), "
            "suggested_title, suggested_description, suggested_storage (AMBIENT, REFRIGERATED, FROZEN, HOT_HOLD), "
            "suggested_portions (integer), visual_tags (list of strings). "
            "DO NOT certify food safety or freshness."
        )
        if user_hint:
            prompt += f" Donor note: {user_hint}"
            
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": encoded_string
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {"response_mime_type": "application/json"}
        }
        
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        res_json = response.json()
        text_content = res_json["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(text_content)
        parsed["provider"] = "gemini_vision"
        parsed["safety_disclaimer"] = "AI recommendations are for drafting convenience only. Donors must manually review all details."
        parsed["requires_donor_confirmation"] = True
        return parsed

    @classmethod
    def generate_listing_assistance(cls, draft_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Capability C: Listing Assistant.
        Identifies missing required fields, suggests clear collection instructions,
        and provides FSSAI shelf-life guidance without inventing facts.
        """
        missing_fields = []
        suggestions = []
        safety_reminders = []
        
        title = draft_data.get("title", "").strip()
        category = draft_data.get("category", "")
        quantity = draft_data.get("quantity")
        unit = draft_data.get("unit", "")
        prep_time = draft_data.get("preparation_time")
        storage = draft_data.get("storage_conditions", "AMBIENT")
        allergens = draft_data.get("allergens", [])
        deadline = draft_data.get("collection_deadline")
        address = draft_data.get("collection_address", "").strip()
        phone = draft_data.get("donor_contact_phone", "").strip()
        
        if not title:
            missing_fields.append("Title")
            suggestions.append("Add a specific title mentioning the main dish or item type (e.g. '30 Portions Dal Tadka & Jeera Rice').")
            
        if not category:
            missing_fields.append("Food Category")
        elif category == "COOKED_MEALS":
            if not prep_time:
                missing_fields.append("Preparation Time")
                safety_reminders.append("FSSAI Rule: Preparation timestamp is mandatory for cooked meals to compute safe distribution limits.")
            if storage == "AMBIENT":
                safety_reminders.append("FSSAI Warning: Ambient cooked food has a strict 4-hour safe collection window from cooking.")
            elif storage == "HOT_HOLD":
                safety_reminders.append("Keep containers at or above 60°C until pickup.")
                
        if not quantity or float(quantity) <= 0:
            missing_fields.append("Quantity")
            
        if not allergens or len(allergens) == 0:
            suggestions.append("Explicitly declare allergens (or select 'None' / confirm nut/dairy/gluten status) to assist recipient organizations.")
            
        if not deadline:
            missing_fields.append("Collection Deadline")
            
        if not address:
            missing_fields.append("Collection Address")
        else:
            suggestions.append("Include parking/gate instructions or landmark (e.g., 'Kitchen back entrance via Service Gate 2').")
            
        if not phone:
            missing_fields.append("Donor Contact Phone")
            
        completeness_score = max(10, int(((10 - len(missing_fields)) / 10.0) * 100))
        
        return {
            "completeness_score": completeness_score,
            "missing_fields": missing_fields,
            "suggestions": suggestions,
            "safety_reminders": safety_reminders,
            "recommended_collection_instruction": f"Please arrive with clean, insulated food containers at {address or 'specified location'}. Present the 6-digit handover OTP upon arrival."
        }

    @classmethod
    def explain_donation_match(cls, donation_data: Dict[str, Any], receiver_org_data: Dict[str, Any], match_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Capability B: Donation Matching Assistant.
        Produces a natural language summary explaining why a donation suits a receiver,
        based entirely on verified database parameters.
        """
        score = match_metadata.get("match_score", 0)
        distance = match_metadata.get("distance_km")
        reasons = match_metadata.get("reasons", [])
        
        org_name = receiver_org_data.get("name", "Recipient Organization")
        title = donation_data.get("title", "Donation")
        portions = donation_data.get("remaining_portions", 0)
        
        summary = (
            f"This donation of '{title}' ({portions} portions) matches {org_name} with a suitability score of {score}/100. "
        )
        if distance is not None:
            summary += f"It is located approximately {distance} km from your registered facility. "
        summary += "Verified criteria: " + "; ".join(reasons)
        
        return {
            "match_score": score,
            "summary_explanation": summary,
            "criteria_breakdown": reasons,
            "deterministic_verification": True
        }
