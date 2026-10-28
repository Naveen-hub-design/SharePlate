import datetime
from backend.utils.time_utils import utc_now

def test_full_donation_reservation_and_pickup_lifecycle(client, auth_tokens):
    now = utc_now()
    deadline = now + datetime.timedelta(hours=6)
    
    # 1. Donor creates published donation of 40 portions
    payload = {
        "title": "40 Portions Catering Biryani",
        "description": "Sealed hot trays.",
        "category": "COOKED_MEALS",
        "quantity": 40,
        "total_portions": 40,
        "preparation_time": (now - datetime.timedelta(minutes=30)).isoformat(),
        "collection_deadline": deadline.isoformat(),
        "storage_conditions": "HOT_HOLD",
        "status": "PUBLISHED"
    }
    create_res = client.post("/api/v1/donations", json=payload, headers=auth_tokens["donor"])
    assert create_res.status_code == 201
    donation_id = create_res.json["donation"]["id"]
    
    # 2. Unverified receiver attempts to claim -> Rejected (403)
    unver_req_res = client.post(
        f"/api/v1/requests/donations/{donation_id}",
        json={"requested_portions": 20},
        headers=auth_tokens["unverified_receiver"]
    )
    assert unver_req_res.status_code == 403
    assert "Organization verification required" in unver_req_res.json["error"]
    
    # 3. Verified receiver attempts to claim 50 portions (exceeds 40 available) -> Rejected (400)
    over_res = client.post(
        f"/api/v1/requests/donations/{donation_id}",
        json={"requested_portions": 50},
        headers=auth_tokens["receiver"]
    )
    assert over_res.status_code == 400
    assert "exceed remaining" in over_res.json["error"]
    
    # 4. Verified receiver claims 40 portions (full batch) -> Success (201)
    claim_res = client.post(
        f"/api/v1/requests/donations/{donation_id}",
        json={"requested_portions": 40, "request_notes": "Urgent shelter supply"},
        headers=auth_tokens["receiver"]
    )
    assert claim_res.status_code == 201
    request_id = claim_res.json["request"]["id"]
    assert claim_res.json["request"]["status"] == "PENDING"
    
    # 5. Donor approves claim request
    approve_res = client.post(
        f"/api/v1/requests/{request_id}/approve",
        headers=auth_tokens["donor"]
    )
    assert approve_res.status_code == 200
    pickup_code = approve_res.json["request"]["pickup_code"]
    assert len(pickup_code) == 6
    assert approve_res.json["request"]["status"] == "APPROVED"
    
    # Verify donation status is now RESERVED
    detail_res = client.get(f"/api/v1/donations/{donation_id}")
    assert detail_res.json["donation"]["status"] == "RESERVED"
    assert detail_res.json["donation"]["remaining_portions"] == 0
    
    # 6. Physical Pickup: Test invalid OTP code rejection
    wrong_pickup_res = client.post(
        "/api/v1/pickups/verify-and-complete",
        json={
            "request_id": request_id,
            "pickup_code": "000000", # wrong OTP
            "safety_checklist_verified": True
        },
        headers=auth_tokens["donor"]
    )
    assert wrong_pickup_res.status_code == 400
    assert "Invalid pickup verification code" in wrong_pickup_res.json["error"]
    
    # 7. Physical Pickup: Valid handover with correct OTP and temperature
    valid_pickup_res = client.post(
        "/api/v1/pickups/verify-and-complete",
        json={
            "request_id": request_id,
            "pickup_code": pickup_code,
            "temperature_at_collection": 63.8,
            "safety_checklist_verified": True,
            "pickup_notes": "Food verified hot at 63.8°C. Loaded into insulated van."
        },
        headers=auth_tokens["donor"]
    )
    assert valid_pickup_res.status_code == 200
    assert valid_pickup_res.json["donation_status"] == "COMPLETED"
    
    # Verify impact stats updated
    impact_res = client.get("/api/v1/analytics/impact")
    assert impact_res.json["metrics"]["total_collected_portions"] >= 40
    assert impact_res.json["metrics"]["completed_donations_count"] >= 1
