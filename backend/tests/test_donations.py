import datetime
from backend.utils.time_utils import utc_now

def test_create_donation_fssai_ambient_cooked_violation(client, auth_tokens):
    """
    FSSAI regulation check: Cooked meals stored at AMBIENT temperature
    cannot have a collection deadline beyond 4 hours from prep time.
    """
    now = utc_now()
    prep_time = now - datetime.timedelta(hours=2)
    # 5 hours after prep time -> 3 hours from now => exceeds 4-hour limit
    invalid_deadline = prep_time + datetime.timedelta(hours=5)
    
    payload = {
        "title": "Expired Cooked Dal & Rice",
        "description": "Leftover rice and curry.",
        "category": "COOKED_MEALS",
        "quantity": 25,
        "total_portions": 25,
        "preparation_time": prep_time.isoformat(),
        "collection_deadline": invalid_deadline.isoformat(),
        "storage_conditions": "AMBIENT", # Ambient strictly enforced to max 4 hours
        "allergens": ["gluten"],
        "status": "PUBLISHED"
    }
    res = client.post("/api/v1/donations", json=payload, headers=auth_tokens["donor"])
    assert res.status_code == 400
    assert "FSSAI Food Safety Rule" in str(res.json)

def test_create_donation_valid_hot_hold(client, auth_tokens):
    now = utc_now()
    prep_time = now - datetime.timedelta(hours=1)
    deadline = now + datetime.timedelta(hours=3)
    
    payload = {
        "title": "30 Portions Fresh Veg Pulao",
        "description": "Freshly cooked catered pulao.",
        "category": "COOKED_MEALS",
        "quantity": 30,
        "total_portions": 30,
        "preparation_time": prep_time.isoformat(),
        "collection_deadline": deadline.isoformat(),
        "storage_conditions": "HOT_HOLD",
        "allergens": ["milk"],
        "status": "PUBLISHED"
    }
    res = client.post("/api/v1/donations", json=payload, headers=auth_tokens["donor"])
    assert res.status_code == 201
    assert res.json["donation"]["status"] == "PUBLISHED"
    assert res.json["donation"]["remaining_portions"] == 30

def test_unverified_donor_cannot_publish(client, auth_tokens):
    now = utc_now()
    deadline = now + datetime.timedelta(hours=12)
    
    payload = {
        "title": "Unverified Sourdough Bread",
        "description": "Bread from unverified bakery.",
        "category": "BAKERY_BREAD",
        "quantity": 20,
        "collection_deadline": deadline.isoformat(),
        "storage_conditions": "AMBIENT",
        "donor_contact_phone": "+91 9988112233",
        "status": "PUBLISHED" # Attempting to publish without admin verification
    }
    res = client.post("/api/v1/donations", json=payload, headers=auth_tokens["unverified_donor"])
    assert res.status_code == 403
    assert "Unverified donors cannot publish" in res.json["error"]

def test_unverified_donor_can_save_draft(client, auth_tokens):
    now = utc_now()
    deadline = now + datetime.timedelta(hours=12)
    
    payload = {
        "title": "Draft Sourdough Bread",
        "description": "Saved as draft.",
        "category": "BAKERY_BREAD",
        "quantity": 20,
        "collection_deadline": deadline.isoformat(),
        "storage_conditions": "AMBIENT",
        "donor_contact_phone": "+91 9988112233",
        "status": "DRAFT" # Allowed for unverified donors
    }
    res = client.post("/api/v1/donations", json=payload, headers=auth_tokens["unverified_donor"])
    assert res.status_code == 201
    assert res.json["donation"]["status"] == "DRAFT"
