import datetime
from typing import Dict, List, Tuple, Any

ALLERGEN_CATALOG = [
    {"id": "gluten", "label": "Cereals containing Gluten (Wheat, Rye, Barley, Oats)"},
    {"id": "milk", "label": "Milk & Dairy Products (including Lactose)"},
    {"id": "eggs", "label": "Eggs & Egg Products"},
    {"id": "peanuts", "label": "Peanuts"},
    {"id": "tree_nuts", "label": "Tree Nuts (Almonds, Cashews, Walnuts, Pistachios)"},
    {"id": "soybeans", "label": "Soybeans & Soy Products"},
    {"id": "fish", "label": "Fish & Fish Products"},
    {"id": "crustaceans", "label": "Crustaceans & Shellfish"},
    {"id": "sulphites", "label": "Sulphites / Preservatives (>10mg/kg)"},
    {"id": "sesame", "label": "Sesame Seeds"},
]

FOOD_CATEGORIES = {
    "COOKED_MEALS": {
        "label": "Cooked / Prepared Meals",
        "ambient_max_hours": 4.0, # FSSAI rule: max 4 hours at ambient temperature
        "requires_prep_time": True,
        "recommended_storage": ["HOT_HOLD", "REFRIGERATED"],
        "fssai_guideline": "Must be hot held above 60°C or refrigerated below 5°C. Ambient cooked food must be distributed within 4 hours.",
    },
    "BAKERY_BREAD": {
        "label": "Bakery, Bread & Baked Goods",
        "ambient_max_hours": 48.0,
        "requires_prep_time": False,
        "recommended_storage": ["AMBIENT"],
        "fssai_guideline": "Keep away from moisture and pests in food-grade packaging. Check for mold before dispatch.",
    },
    "PACKAGED_GOODS": {
        "label": "Packaged / Dry Groceries",
        "ambient_max_hours": 720.0, # Up to 30 days or best before date
        "requires_prep_time": False,
        "recommended_storage": ["AMBIENT"],
        "fssai_guideline": "Intact seals required. Must be within Best Before or Expiry Date as indicated on label.",
    },
    "FRESH_PRODUCE": {
        "label": "Fresh Fruits & Vegetables",
        "ambient_max_hours": 48.0,
        "requires_prep_time": False,
        "recommended_storage": ["AMBIENT", "REFRIGERATED"],
        "fssai_guideline": "Inspect for rot, bruising, or fungal contamination. Must be segregated from non-veg.",
    },
    "DAIRY": {
        "label": "Dairy & Milk Products",
        "ambient_max_hours": 2.0,
        "requires_prep_time": False,
        "recommended_storage": ["REFRIGERATED"],
        "fssai_guideline": "Continuous cold chain (below 5°C) mandatory. Discard if curds show souring or separation.",
    },
    "BEVERAGES": {
        "label": "Beverages & Drinks",
        "ambient_max_hours": 24.0,
        "requires_prep_time": False,
        "recommended_storage": ["AMBIENT", "REFRIGERATED"],
        "fssai_guideline": "Sealed bottles or food-grade dispensers only. Do not rescue unsealed fresh juice past 2 hours.",
    },
    "OTHER": {
        "label": "Other Food Items",
        "ambient_max_hours": 12.0,
        "requires_prep_time": False,
        "recommended_storage": ["AMBIENT", "REFRIGERATED"],
        "fssai_guideline": "Inspect thoroughly before consumption. Apply precautionary food hygiene standards.",
    }
}

class FoodSafetyService:
    @staticmethod
    def get_allergen_catalog() -> List[Dict[str, str]]:
        return ALLERGEN_CATALOG

    @staticmethod
    def get_food_categories() -> Dict[str, Any]:
        return FOOD_CATEGORIES

    @staticmethod
    def validate_donation_safety(
        category: str,
        storage_conditions: str,
        preparation_time: datetime.datetime = None,
        collection_deadline: datetime.datetime = None,
        available_from: datetime.datetime = None,
        allergens: List[str] = None
    ) -> Tuple[bool, List[str], List[str]]:
        """
        Validates donation parameters against Indian FSSAI safety criteria.
        Returns (is_valid, errors_list, warnings_list).
        """
        errors = []
        warnings = []
        now = datetime.datetime.utcnow()
        
        # 1. Validate Category
        if category not in FOOD_CATEGORIES:
            errors.append(f"Invalid food category '{category}'. Must be one of {list(FOOD_CATEGORIES.keys())}.")
            return False, errors, warnings
            
        category_meta = FOOD_CATEGORIES[category]
        
        # 2. Timing and Deadlines
        if not collection_deadline:
            errors.append("Collection deadline is mandatory.")
        elif collection_deadline <= now:
            errors.append("Collection deadline must be set in the future.")
            
        if available_from and collection_deadline and available_from > collection_deadline:
            errors.append("Available-from time cannot be after collection deadline.")
            
        # 3. Cooked Meals Safety Window (FSSAI 4-hour ambient rule)
        if category == "COOKED_MEALS":
            if not preparation_time:
                errors.append("Preparation time is mandatory for cooked/prepared meals under FSSAI surplus food regulations.")
            else:
                if preparation_time > now + datetime.timedelta(minutes=30):
                    errors.append("Preparation time cannot be in the future.")
                    
                if storage_conditions == "AMBIENT":
                    # Max 4 hours from prep time
                    max_ambient_expiry = preparation_time + datetime.timedelta(hours=4.0)
                    if collection_deadline and collection_deadline > max_ambient_expiry:
                        errors.append(
                            f"FSSAI Food Safety Rule: Cooked meals stored at AMBIENT temperature must be collected within 4 hours of preparation (by {max_ambient_expiry.strftime('%Y-%m-%d %H:%M UTC')}). Choose REFRIGERATED or HOT_HOLD storage to extend safe pickup window."
                        )
                elif storage_conditions == "HOT_HOLD":
                    warnings.append(
                        "FSSAI Regulation: Hot-held cooked meals must be maintained continuously at >= 60°C until collected."
                    )
                elif storage_conditions == "REFRIGERATED":
                    warnings.append(
                        "FSSAI Regulation: Chilled cooked meals must be kept continuously at <= 5°C until collection."
                    )
                    
        # 4. Dairy Storage Requirements
        if category == "DAIRY" and storage_conditions not in ["REFRIGERATED", "FROZEN"]:
            errors.append("FSSAI Regulation: Dairy products require cold chain preservation (REFRIGERATED or FROZEN storage). AMBIENT storage is prohibited.")
            
        # 5. Allergens
        if allergens is None or len(allergens) == 0:
            warnings.append("No allergens declared. Ensure food does not contain unlabeled allergens before sharing.")
            
        return len(errors) == 0, errors, warnings

    @staticmethod
    def get_pre_collection_safety_checklist(category: str, storage_conditions: str) -> List[Dict[str, Any]]:
        """
        Returns mandatory food safety checklist items that a receiver must verify prior to collecting food.
        """
        items = [
            {"id": "visual_hygiene", "text": "Visual check: Food shows no discoloration, signs of spoilage, off-odors, or pest damage.", "mandatory": True},
            {"id": "packaging_intact", "text": "Packaging check: Containers are clean, sealed, food-grade, and free of leaks.", "mandatory": True},
            {"id": "allergen_cross_check", "text": "Allergen review: Verified declared allergen list matches target recipient dietary needs.", "mandatory": True},
        ]
        
        if category == "COOKED_MEALS":
            if storage_conditions == "HOT_HOLD":
                items.append({"id": "temp_check", "text": "Temperature check: Food feels hot (maintained at or above 60°C).", "mandatory": True})
            elif storage_conditions in ["REFRIGERATED", "FROZEN"]:
                items.append({"id": "temp_check", "text": "Temperature check: Food is cold (maintained at or below 5°C).", "mandatory": True})
            else:
                items.append({"id": "prep_time_check", "text": "Time check: Food was prepared within the last 4 hours.", "mandatory": True})
                
        return items
