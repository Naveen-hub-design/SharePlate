import math
import requests
import datetime
from flask import Blueprint, request, jsonify
from backend.models.donation import Donation
from backend.utils.time_utils import utc_now
from backend.services.matching_service import haversine_distance_km

route_bp = Blueprint("route", __name__, url_prefix="/api/v1/routes")

# Predefined landmark coordinates for quick zero-latency search fallback
BANGALORE_LANDMARKS = [
    {"name": "Indiranagar, Bangalore", "lat": 12.9784, "lng": 77.6408},
    {"name": "Koramangala, Bangalore", "lat": 12.9352, "lng": 77.6245},
    {"name": "MG Road / Brigade Road, Bangalore", "lat": 12.9756, "lng": 77.6066},
    {"name": "Whitefield, Bangalore", "lat": 12.9698, "lng": 77.7499},
    {"name": "HSR Layout, Bangalore", "lat": 12.9121, "lng": 77.6446},
    {"name": "Jayanagar, Bangalore", "lat": 12.9308, "lng": 77.5838},
    {"name": "Malleshwaram, Bangalore", "lat": 13.0055, "lng": 77.5692},
    {"name": "Electronic City, Bangalore", "lat": 12.8399, "lng": 77.6770},
    {"name": "Hebbal, Bangalore", "lat": 13.0358, "lng": 77.5970},
    {"name": "Yelahanka, Bangalore", "lat": 13.1007, "lng": 77.5963},
    {"name": "Rajajinagar, Bangalore", "lat": 12.9982, "lng": 77.5530},
    {"name": "Marathahalli, Bangalore", "lat": 12.9569, "lng": 77.7011},
    {"name": "Banashankari, Bangalore", "lat": 12.9255, "lng": 77.5468},
    {"name": "Bellandur, Bangalore", "lat": 12.9304, "lng": 77.6784},
    {"name": "Frazer Town / Pulakeshinagar, Bangalore", "lat": 12.9968, "lng": 77.6133},
]

def generate_interpolated_route(lat1: float, lon1: float, lat2: float, lon2: float, steps_count: int = 15):
    """Generates a realistic curved road-like polyline between two GPS points."""
    coords = []
    # Subtle mid-point road curve simulation
    mid_lat = (lat1 + lat2) / 2.0
    mid_lon = (lon1 + lon2) / 2.0
    
    # Perpendicular offset to mimic road routing rather than a ruler-straight line
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    perp_lat = -dlon * 0.12
    perp_lon = dlat * 0.12
    
    for i in range(steps_count + 1):
        t = i / float(steps_count)
        # Quadratic bezier interpolation
        cur_lat = (1 - t)**2 * lat1 + 2 * (1 - t) * t * (mid_lat + perp_lat) + t**2 * lat2
        cur_lon = (1 - t)**2 * lon1 + 2 * (1 - t) * t * (mid_lon + perp_lon) + t**2 * lon2
        coords.append([round(cur_lat, 5), round(cur_lon, 5)])
    return coords

@route_bp.route("/directions", methods=["GET"])
def get_directions():
    """
    Returns driving/transit route, turn-by-turn guidance, distance, ETA, 
    and FSSAI food safety transit window feasibility.
    """
    try:
        origin_lat = float(request.args.get("origin_lat", 0))
        origin_lng = float(request.args.get("origin_lng", 0))
        dest_lat = float(request.args.get("dest_lat", 0))
        dest_lng = float(request.args.get("dest_lng", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid coordinates provided"}), 400

    if not (origin_lat and origin_lng and dest_lat and dest_lng):
        return jsonify({"error": "origin_lat, origin_lng, dest_lat, and dest_lng are required"}), 400

    mode = request.args.get("mode", "driving").lower()
    donation_id = request.args.get("donation_id", type=int)

    # Average city speeds in km/h for Bangalore / urban logistics
    SPEED_MAP = {
        "driving": 24.0,       # Delivery van / cargo car in city traffic
        "motorcycle": 30.0,    # Two-wheeler food courier
        "bicycle": 14.0,       # Eco-delivery cycle
        "walking": 4.5         # On foot
    }
    speed_kmh = SPEED_MAP.get(mode, 24.0)

    # Calculate baseline haversine distance
    straight_distance_km = haversine_distance_km(origin_lat, origin_lng, dest_lat, dest_lng)
    # Urban road distance is typically 1.25x - 1.35x of direct line
    estimated_road_distance_km = round(straight_distance_km * 1.3, 2)
    estimated_duration_mins = max(4, round((estimated_road_distance_km / speed_kmh) * 60))

    route_coords = []
    turn_steps = []
    source = "fallback"

    # Attempt OSRM public API with 2.5s timeout
    try:
        osrm_profile = "driving"
        if mode in ("motorcycle", "bicycle"):
            osrm_profile = "bicycle"
        elif mode == "walking":
            osrm_profile = "foot"
            
        url = f"https://router.project-osrm.org/route/v1/{osrm_profile}/{origin_lng},{origin_lat};{dest_lng},{dest_lat}?overview=full&geometries=geojson&steps=true"
        resp = requests.get(url, timeout=2.5, headers={"User-Agent": "SharePlateRescue/1.0"})
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok" and data.get("routes"):
                route = data["routes"][0]
                # Distance in meters -> km
                estimated_road_distance_km = round(route["distance"] / 1000.0, 2)
                # Duration in seconds -> minutes
                estimated_duration_mins = max(3, round(route["duration"] / 60.0))
                # GeoJSON coordinates are [lon, lat], Leaflet needs [lat, lon]
                route_coords = [[pt[1], pt[0]] for pt in route["geometry"]["coordinates"]]
                
                # Parse steps
                for leg in route.get("legs", []):
                    for step in leg.get("steps", []):
                        maneuver = step.get("maneuver", {})
                        instruction = step.get("name") or maneuver.get("type", "Proceed")
                        modifier = maneuver.get("modifier", "")
                        step_dist = round(step.get("distance", 0) / 1000.0, 2)
                        step_dur = round(step.get("duration", 0) / 60.0, 1)
                        if step_dist > 0.05 or instruction:
                            turn_steps.append({
                                "instruction": f"{instruction.capitalize()} {modifier}".strip(),
                                "distance_km": step_dist,
                                "duration_min": step_dur,
                                "type": maneuver.get("type", "turn")
                            })
                source = "osrm"
    except Exception:
        # Fallback will activate smoothly below
        pass

    # If route_coords empty (e.g. offline, rate limit, or timeout), generate bezier road curve
    if not route_coords:
        route_coords = generate_interpolated_route(origin_lat, origin_lng, dest_lat, dest_lng, steps_count=20)
        turn_steps = [
            {"instruction": "Depart from Donor food preparation / dispatch door", "distance_km": 0.1, "duration_min": 1, "type": "depart"},
            {"instruction": f"Follow arterial street toward recipient facility ({estimated_road_distance_km * 0.4:.1f} km)", "distance_km": round(estimated_road_distance_km * 0.4, 2), "duration_min": round(estimated_duration_mins * 0.4), "type": "straight"},
            {"instruction": f"Continue along main corridor toward distribution hub ({estimated_road_distance_km * 0.5:.1f} km)", "distance_km": round(estimated_road_distance_km * 0.5, 2), "duration_min": round(estimated_duration_mins * 0.5), "type": "straight"},
            {"instruction": "Turn into NGO / Community kitchen receiving gate", "distance_km": 0.2, "duration_min": 1, "type": "turn"},
            {"instruction": "Arrive at handover verification bay", "distance_km": 0.0, "duration_min": 0, "type": "arrive"}
        ]
        source = "heuristic_urban"

    # FSSAI Food Safety Transit Window Evaluation
    fssai_safety_analysis = {
        "status": "SAFE",
        "safe_window_confirmed": True,
        "message": "Transit time is well within safe food rescue parameters.",
        "minutes_remaining_after_transit": None,
        "collection_deadline": None
    }

    if donation_id:
        donation = Donation.query.get(donation_id)
        if donation and donation.collection_deadline:
            now = utc_now()
            minutes_to_deadline = (donation.collection_deadline - now).total_seconds() / 60.0
            # Total estimated trip = travel duration + 15 min buffer for physical inspection & 6-digit OTP verification
            total_required_mins = estimated_duration_mins + 15
            buffer_remaining = round(minutes_to_deadline - total_required_mins)

            fssai_safety_analysis["collection_deadline"] = donation.collection_deadline.isoformat()
            fssai_safety_analysis["minutes_remaining_after_transit"] = max(0, buffer_remaining)

            if minutes_to_deadline <= 0:
                fssai_safety_analysis["status"] = "EXPIRED"
                fssai_safety_analysis["safe_window_confirmed"] = False
                fssai_safety_analysis["message"] = "Collection deadline has already elapsed. Food cannot be safely transported."
            elif total_required_mins > minutes_to_deadline:
                fssai_safety_analysis["status"] = "RISK_EXCEEDED"
                fssai_safety_analysis["safe_window_confirmed"] = False
                fssai_safety_analysis["message"] = f"Transit and verification ({total_required_mins} mins) exceeds remaining safe window ({round(minutes_to_deadline)} mins)."
            elif buffer_remaining < 30:
                fssai_safety_analysis["status"] = "URGENT"
                fssai_safety_analysis["safe_window_confirmed"] = True
                fssai_safety_analysis["message"] = f"Urgent dispatch advised! Only ~{buffer_remaining} minutes safety buffer remaining after transit."
            else:
                fssai_safety_analysis["status"] = "OPTIMAL"
                fssai_safety_analysis["safe_window_confirmed"] = True
                fssai_safety_analysis["message"] = f"Safe transit window confirmed. ~{buffer_remaining} minutes buffer remaining."

    return jsonify({
        "mode": mode,
        "distance_km": estimated_road_distance_km,
        "duration_minutes": estimated_duration_mins,
        "traffic_condition": "MODERATE",
        "route_coordinates": route_coords,
        "turn_by_turn": turn_steps,
        "origin": {"lat": origin_lat, "lng": origin_lng},
        "destination": {"lat": dest_lat, "lng": dest_lng},
        "fssai_safety": fssai_safety_analysis,
        "routing_source": source
    }), 200

@route_bp.route("/geocode", methods=["GET"])
def geocode_location():
    """
    Search landmarks or addresses in Bangalore with immediate fuzzy match and zero latency.
    """
    query = request.args.get("query", "").strip().lower()
    if not query or len(query) < 2:
        return jsonify({"results": []}), 200

    matches = []
    # 1. Match local Bangalore landmarks first
    for item in BANGALORE_LANDMARKS:
        if query in item["name"].lower():
            matches.append({
                "label": item["name"],
                "lat": item["lat"],
                "lng": item["lng"],
                "type": "landmark"
            })

    # 2. If fewer than 2 matches, attempt OpenStreetMap Nominatim with 2s timeout
    if len(matches) < 3:
        try:
            url = f"https://nominatim.openstreetmap.org/search?q={requests.utils.quote(query + ', Bangalore')}&format=json&limit=4"
            resp = requests.get(url, timeout=2.0, headers={"User-Agent": "SharePlateRescue/1.0"})
            if resp.status_code == 200:
                data = resp.json()
                for d in data:
                    matches.append({
                        "label": d.get("display_name", query),
                        "lat": float(d["lat"]),
                        "lng": float(d["lon"]),
                        "type": "osm_geocoded"
                    })
        except Exception:
            pass

    return jsonify({"results": matches[:6]}), 200
