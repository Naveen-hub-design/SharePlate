from backend.services.ai_service import AIServiceAdapter
from backend.services.food_safety_service import FoodSafetyService

def test_ai_photo_analysis_deterministic_fallback():
    """Verifies that photo analysis provides structured output even without an external API key."""
    result = AIServiceAdapter.analyze_food_photo("sample_biryani_rice.jpg", user_hint="warm catering rice")
    assert "suggested_category" in result
    assert result["suggested_category"] == "COOKED_MEALS"
    assert "suggested_title" in result
    assert "safety_disclaimer" in result
    assert result["requires_donor_confirmation"] is True
    # Verify AI never claims food is safe
    assert "safe" not in result["suggested_description"].lower() or "ready" in result["suggested_description"].lower()

def test_ai_listing_assistant_flags_missing_safety_fields():
    incomplete_draft = {
        "title": "Rice",
        "category": "COOKED_MEALS",
        # Missing preparation_time, storage_conditions, allergens, deadline
    }
    res = AIServiceAdapter.generate_listing_assistance(incomplete_draft)
    assert res["completeness_score"] < 100
    assert "Preparation Time" in res["missing_fields"]
    assert "Collection Deadline" in res["missing_fields"]
    assert any("FSSAI" in reminder for reminder in res["safety_reminders"])

def test_ai_matching_explanation_is_deterministic_and_grounded():
    donation_data = {
        "title": "40 Portions Fresh Bread",
        "remaining_portions": 40
    }
    receiver_org = {
        "name": "City Shelter Foundation"
    }
    match_meta = {
        "match_score": 88.5,
        "distance_km": 4.2,
        "reasons": ["Within 4.2 km", "Batch size fits capacity"]
    }
    explanation = AIServiceAdapter.explain_donation_match(donation_data, receiver_org, match_meta)
    assert explanation["match_score"] == 88.5
    assert "City Shelter Foundation" in explanation["summary_explanation"]
    assert "4.2 km" in explanation["summary_explanation"]
