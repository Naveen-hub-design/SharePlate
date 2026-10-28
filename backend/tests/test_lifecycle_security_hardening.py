import datetime
from backend.utils.time_utils import utc_now
from backend.extensions import db
from backend.models.donation import Donation
from backend.models.donation_request import DonationRequest

def test_over_reservation_rejected(client, auth_tokens):
    now = utc_now()
    deadline = now + datetime.timedelta(hours=2)
    
    # 1. Create donation with 20 portions
    payload = {
        "title": "20 Portions Sandwiches",
        "description": "Sealed vegetarian sandwiches.",
        "category": "COOKED_MEALS",
        "quantity": 20,
        "total_portions": 20,
        "preparation_time": (now - datetime.timedelta(minutes=30)).isoformat(),
        "collection_deadline": deadline.isoformat(),
        "storage_conditions": "HOT_HOLD",
        "status": "PUBLISHED"
    }
    create_res = client.post("/api/v1/donations", json=payload, headers=auth_tokens["donor"])
    assert create_res.status_code == 201
    donation_id = create_res.json["donation"]["id"]
    
    # 2. Receiver attempts to claim 25 portions (exceeds remaining)
    claim_res = client.post(
        f"/api/v1/requests/donations/{donation_id}",
        json={"requested_portions": 25, "request_notes": "All of it please"},
        headers=auth_tokens["receiver"]
    )
    assert claim_res.status_code == 400
    assert "exceed remaining" in claim_res.json["error"]

def test_repeated_otp_and_duplicate_pickup_prevention(client, auth_tokens):
    now = utc_now()
    deadline = now + datetime.timedelta(hours=3)
    
    # 1. Create donation with 15 portions
    payload = {
        "title": "15 Portions Biryani",
        "description": "Hot catering biryani.",
        "category": "COOKED_MEALS",
        "quantity": 15,
        "total_portions": 15,
        "preparation_time": (now - datetime.timedelta(minutes=20)).isoformat(),
        "collection_deadline": deadline.isoformat(),
        "storage_conditions": "HOT_HOLD",
        "status": "PUBLISHED"
    }
    donation_res = client.post("/api/v1/donations", json=payload, headers=auth_tokens["donor"])
    assert donation_res.status_code == 201
    donation_id = donation_res.json["donation"]["id"]
    
    # 2. Receiver claims 15 portions
    claim_res = client.post(
        f"/api/v1/requests/donations/{donation_id}",
        json={"requested_portions": 15},
        headers=auth_tokens["receiver"]
    )
    assert claim_res.status_code == 201
    request_id = claim_res.json["request"]["id"]
    
    # 3. Donor approves
    approve_res = client.post(f"/api/v1/requests/{request_id}/approve", headers=auth_tokens["donor"])
    assert approve_res.status_code == 200
    otp = approve_res.json["request"]["pickup_code"]
    assert len(otp) == 6
    
    # 4. Verify pickup first time -> Success (200)
    verify_payload = {
        "request_id": request_id,
        "pickup_code": otp,
        "safety_checklist_verified": True,
        "temperature_at_collection": 65.5
    }
    verify_res1 = client.post("/api/v1/pickups/verify", json=verify_payload, headers=auth_tokens["donor"])
    assert verify_res1.status_code == 200
    assert verify_res1.json["donation_status"] == "COMPLETED"
    
    # 5. Repeated OTP submission -> Rejected (409 Conflict)
    verify_res2 = client.post("/api/v1/pickups/verify", json=verify_payload, headers=auth_tokens["donor"])
    assert verify_res2.status_code == 409
    assert "already been verified" in verify_res2.json["error"]

def test_expired_donation_otp_handover_rejected(client, auth_tokens, app):
    now = utc_now()
    deadline = now + datetime.timedelta(hours=2)
    
    # 1. Create donation
    payload = {
        "title": "Fresh Paneer Curry",
        "description": "Sealed tray.",
        "category": "COOKED_MEALS",
        "quantity": 10,
        "total_portions": 10,
        "preparation_time": (now - datetime.timedelta(minutes=15)).isoformat(),
        "collection_deadline": deadline.isoformat(),
        "storage_conditions": "HOT_HOLD",
        "status": "PUBLISHED"
    }
    donation_res = client.post("/api/v1/donations", json=payload, headers=auth_tokens["donor"])
    donation_id = donation_res.json["donation"]["id"]
    
    # 2. Receiver claims
    claim_res = client.post(
        f"/api/v1/requests/donations/{donation_id}",
        json={"requested_portions": 10},
        headers=auth_tokens["receiver"]
    )
    request_id = claim_res.json["request"]["id"]
    
    # 3. Approve
    approve_res = client.post(f"/api/v1/requests/{request_id}/approve", headers=auth_tokens["donor"])
    otp = approve_res.json["request"]["pickup_code"]
    
    # 4. Simulate collection window expiring
    don = db.session.get(Donation, donation_id)
    don.collection_deadline = now - datetime.timedelta(minutes=10)
    db.session.commit()
    db.session.expire_all()
        
    # 5. Handover attempt after deadline has passed -> Rejected (400 per FSSAI regulations)
    verify_payload = {
        "request_id": request_id,
        "pickup_code": otp,
        "safety_checklist_verified": True
    }
    verify_res = client.post("/api/v1/pickups/verify", json=verify_payload, headers=auth_tokens["donor"])
    assert verify_res.status_code == 400
    assert "expired" in verify_res.json["error"].lower()

def test_invalid_otp_rejected(client, auth_tokens):
    now = utc_now()
    deadline = now + datetime.timedelta(hours=3)
    
    payload = {
        "title": "Fresh Fruit Baskets",
        "description": "Assorted apples and bananas.",
        "category": "FRESH_PRODUCE",
        "quantity": 10,
        "total_portions": 10,
        "collection_deadline": deadline.isoformat(),
        "storage_conditions": "AMBIENT",
        "status": "PUBLISHED"
    }
    don_res = client.post("/api/v1/donations", json=payload, headers=auth_tokens["donor"])
    donation_id = don_res.json["donation"]["id"]
    
    claim_res = client.post(
        f"/api/v1/requests/donations/{donation_id}",
        json={"requested_portions": 10},
        headers=auth_tokens["receiver"]
    )
    request_id = claim_res.json["request"]["id"]
    
    client.post(f"/api/v1/requests/{request_id}/approve", headers=auth_tokens["donor"])
    
    # Enter wrong OTP
    verify_res = client.post(
        "/api/v1/pickups/verify",
        json={"request_id": request_id, "pickup_code": "000000", "safety_checklist_verified": True},
        headers=auth_tokens["donor"]
    )
    assert verify_res.status_code == 400
    assert "Invalid pickup verification code" in verify_res.json["error"]

def test_unauthorized_state_changes_rejected(client, auth_tokens):
    now = utc_now()
    deadline = now + datetime.timedelta(hours=4)
    
    # 1. Donor creates listing
    don_res = client.post(
        "/api/v1/donations",
        json={
            "title": "Bakery Croissants",
            "description": "Assorted pastries.",
            "category": "BAKERY_BREAD",
            "quantity": 20,
            "total_portions": 20,
            "collection_deadline": deadline.isoformat(),
            "storage_conditions": "AMBIENT",
            "status": "PUBLISHED"
        },
        headers=auth_tokens["donor"]
    )
    donation_id = don_res.json["donation"]["id"]
    
    # 2. Donor itself cannot claim food (only RECEIVER can claim)
    claim_as_donor = client.post(
        f"/api/v1/requests/donations/{donation_id}",
        json={"requested_portions": 5},
        headers=auth_tokens["donor"]
    )
    assert claim_as_donor.status_code == 403
    
    # 3. Receiver claims
    claim_res = client.post(
        f"/api/v1/requests/donations/{donation_id}",
        json={"requested_portions": 5},
        headers=auth_tokens["receiver"]
    )
    request_id = claim_res.json["request"]["id"]
    
    # 4. Another donor (or unverified donor) cannot approve this request
    approve_fraud = client.post(
        f"/api/v1/requests/{request_id}/approve",
        headers=auth_tokens["unverified_donor"]
    )
    assert approve_fraud.status_code == 403
    assert "Forbidden" in approve_fraud.json["error"]

def test_public_discovery_pii_masking(client, auth_tokens):
    now = utc_now()
    deadline = now + datetime.timedelta(hours=4)
    
    client.post(
        "/api/v1/donations",
        json={
            "title": "Private Contact Catering",
            "description": "Food description.",
            "category": "PACKAGED_GOODS",
            "quantity": 10,
            "total_portions": 10,
            "collection_deadline": deadline.isoformat(),
            "storage_conditions": "AMBIENT",
            "donor_contact_phone": "+91 98450 12345",
            "status": "PUBLISHED"
        },
        headers=auth_tokens["donor"]
    )
    
    # Public discovery (unauthenticated guest)
    res = client.get("/api/v1/donations/discover")
    assert res.status_code == 200
    donations = res.json["donations"]
    assert len(donations) > 0
    
    target_don = next(d for d in donations if d["title"] == "Private Contact Catering")
    # Verified: personal contact phone is masked with bullet characters
    assert "••••" in target_don["donor_contact_phone"]
    assert "12345" not in target_don["donor_contact_phone"]
    assert "Registered Coordinator" in target_don["donor_organization"]["contact_person"]

def test_upload_path_traversal_prevention(client):
    # Prohibited subfolder
    res = client.get("/api/v1/uploads/../../etc/passwd")
    assert res.status_code in [400, 404]
    
    # Non-whitelisted subfolder
    res2 = client.get("/api/v1/uploads/secret/config.json")
    assert res2.status_code == 400
    assert "Invalid upload category" in res2.json["error"]

def test_auth_logout(client, auth_tokens):
    res = client.post("/api/v1/auth/logout", headers=auth_tokens["donor"])
    assert res.status_code == 200
    assert "Successfully logged out" in res.json["message"]
