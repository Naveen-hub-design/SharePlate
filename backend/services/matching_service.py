import math
import datetime
from typing import Dict, List, Any, Optional

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0 # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class MatchingService:
    @staticmethod
    def calculate_match_score(
        donation: Any,
        receiver_org: Any,
        max_distance_km: float = 25.0
    ) -> Optional[Dict[str, Any]]:
        """
        Calculates an explainable match score (0 to 100) between an available donation and a verified receiver organization.
        Returns match metadata with explanation breakdown, or None if disqualified.
        """
        # 1. Eligibility Filters
        if donation.status != "PUBLISHED":
            return None
            
        if donation.remaining_portions <= 0:
            return None
            
        now = datetime.datetime.utcnow()
        if donation.collection_deadline <= now:
            return None
            
        if receiver_org.verification_status != "VERIFIED":
            return None
            
        # 2. Distance Scoring (Weight: 40%)
        distance_km = None
        distance_score = 70.0 # default baseline if coordinates missing
        distance_reason = "Distance calculation based on regional availability."
        
        if (
            donation.latitude is not None
            and donation.longitude is not None
            and receiver_org.latitude is not None
            and receiver_org.longitude is not None
        ):
            distance_km = haversine_distance_km(
                donation.latitude,
                donation.longitude,
                receiver_org.latitude,
                receiver_org.longitude
            )
            
            if distance_km > max_distance_km:
                # Beyond max configured radius
                return None
                
            # Score scaled linearly: 0 km = 100, max_distance_km = 30
            distance_ratio = max(0.0, 1.0 - (distance_km / max_distance_km))
            distance_score = 30.0 + (distance_ratio * 70.0)
            distance_reason = f"Within {distance_km} km of your distribution center ({distance_score:.0f}/100)."
            
        # 3. Urgency & Shelf Life Scoring (Weight: 25%)
        # Urgent food that needs rescue quickly gets priority match
        hours_remaining = (donation.collection_deadline - now).total_seconds() / 3600.0
        if hours_remaining <= 0:
            return None
            
        if hours_remaining < 2.0:
            urgency_score = 95.0
            urgency_reason = f"Urgent rescue needed! Only {hours_remaining:.1f} hours remaining."
        elif hours_remaining < 6.0:
            urgency_score = 85.0
            urgency_reason = f"{hours_remaining:.1f} hours remaining before deadline."
        elif hours_remaining < 24.0:
            urgency_score = 75.0
            urgency_reason = f"{hours_remaining:.1f} hours until collection window closes."
        else:
            urgency_score = 60.0
            urgency_reason = f"Extended window: {hours_remaining / 24.0:.1f} days available."
            
        # 4. Quantity & Capacity Suitability (Weight: 20%)
        capacity_info = receiver_org.capacity_info or {}
        daily_capacity = capacity_info.get("servings_per_day", 100)
        remaining = donation.remaining_portions
        
        if daily_capacity > 0:
            # Optimal if remaining portions fits within receiver's daily capacity
            if remaining <= daily_capacity:
                quantity_score = 95.0
                quantity_reason = f"Batch size ({remaining} portions) matches your stated daily handling capacity ({daily_capacity} servings)."
            else:
                quantity_score = 65.0
                quantity_reason = f"Large batch ({remaining} portions) may require partial distribution."
        else:
            quantity_score = 75.0
            quantity_reason = f"{remaining} portions available for rescue."
            
        # 5. Cold Storage / Transport Requirement (Weight: 15%)
        storage_score = 85.0
        storage_reason = f"Requires standard {donation.storage_conditions.replace('_', ' ').lower()} handling."
        
        if donation.storage_conditions in ["REFRIGERATED", "FROZEN"]:
            has_cold_storage = capacity_info.get("has_cold_storage", False)
            if has_cold_storage:
                storage_score = 100.0
                storage_reason = "Your organization has verified cold-storage capability for chilled food."
            else:
                storage_score = 50.0
                storage_reason = "Chilled items require rapid transport or cold-holding facility."
                
        # Total Weighted Score
        final_score = (
            (distance_score * 0.40)
            + (urgency_score * 0.25)
            + (quantity_score * 0.20)
            + (storage_score * 0.15)
        )
        final_score = min(100.0, max(0.0, round(final_score, 1)))
        
        return {
            "donation_id": donation.id,
            "match_score": final_score,
            "distance_km": distance_km,
            "reasons": [
                distance_reason,
                urgency_reason,
                quantity_reason,
                storage_reason
            ]
        }
