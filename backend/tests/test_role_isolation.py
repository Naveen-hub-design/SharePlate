import pytest

def test_receiver_cannot_access_donor_analytics(client, auth_tokens):
    """Ensure RECEIVER role cannot access donor-specific analytics dashboard."""
    res = client.get("/api/v1/analytics/donor-dashboard", headers=auth_tokens["receiver"])
    assert res.status_code == 403
    data = res.get_json()
    assert "error" in data
    assert "Access denied" in data["error"] or "Forbidden" in data["error"]

def test_donor_cannot_access_receiver_analytics(client, auth_tokens):
    """Ensure DONOR role cannot access receiver-specific analytics dashboard."""
    res = client.get("/api/v1/analytics/receiver-dashboard", headers=auth_tokens["donor"])
    assert res.status_code == 403
    data = res.get_json()
    assert "error" in data
    assert "Access denied" in data["error"] or "Forbidden" in data["error"]

def test_receiver_cannot_create_donation(client, auth_tokens):
    """Ensure RECEIVER role cannot create food donation listings."""
    payload = {
        "title": "Unauthorized Listing Attempt",
        "description": "Should fail with 403",
        "category": "COOKED_MEALS",
        "quantity": 25,
        "unit": "portions",
    }
    res = client.post("/api/v1/donations", json=payload, headers=auth_tokens["receiver"])
    assert res.status_code == 403

def test_non_admin_cannot_access_admin_overview(client, auth_tokens):
    """Ensure DONOR and RECEIVER cannot access administrative overview."""
    res_donor = client.get("/api/v1/admin/overview", headers=auth_tokens["donor"])
    assert res_donor.status_code == 403

    res_receiver = client.get("/api/v1/admin/overview", headers=auth_tokens["receiver"])
    assert res_receiver.status_code == 403

def test_non_admin_cannot_access_admin_verifications(client, auth_tokens):
    """Ensure non-admin accounts cannot access organization verification reviews."""
    res = client.get("/api/v1/admin/verifications", headers=auth_tokens["donor"])
    assert res.status_code == 403

def test_unauthenticated_requests_blocked(client):
    """Ensure endpoints strictly reject unauthenticated requests with 401."""
    res1 = client.get("/api/v1/analytics/donor-dashboard")
    assert res1.status_code == 401

    res2 = client.get("/api/v1/analytics/receiver-dashboard")
    assert res2.status_code == 401

    res3 = client.get("/api/v1/admin/overview")
    assert res3.status_code == 401

def test_donor_role_only_requests_endpoint(client, auth_tokens):
    """Verify /api/v1/requests/donor is restricted to DONOR and ADMIN."""
    # Receiver should be blocked
    res_recv = client.get("/api/v1/requests/donor", headers=auth_tokens["receiver"])
    assert res_recv.status_code == 403

    # Donor should be permitted
    res_donor = client.get("/api/v1/requests/donor", headers=auth_tokens["donor"])
    assert res_donor.status_code == 200

def test_receiver_role_only_requests_endpoint(client, auth_tokens):
    """Verify /api/v1/requests/receiver is restricted to RECEIVER and ADMIN."""
    # Donor should be blocked
    res_donor = client.get("/api/v1/requests/receiver", headers=auth_tokens["donor"])
    assert res_donor.status_code == 403

    # Receiver should be permitted
    res_recv = client.get("/api/v1/requests/receiver", headers=auth_tokens["receiver"])
    assert res_recv.status_code == 200

def test_cross_organization_donation_modification_blocked(client, auth_tokens):
    """Verify Donor B cannot edit or withdraw Donor A's donation listing."""
    import datetime
    from backend.utils.time_utils import utc_now
    now = utc_now()
    payload = {
        "title": "Donor A Fresh Meals",
        "description": "Sealed meals.",
        "category": "COOKED_MEALS",
        "quantity": 20,
        "total_portions": 20,
        "preparation_time": (now - datetime.timedelta(minutes=30)).isoformat(),
        "collection_deadline": (now + datetime.timedelta(hours=3)).isoformat(),
        "storage_conditions": "HOT_HOLD",
        "status": "PUBLISHED"
    }
    create_res = client.post("/api/v1/donations", json=payload, headers=auth_tokens["donor"])
    assert create_res.status_code == 201
    don_id = create_res.json["donation"]["id"]

    # Another donor tries to edit
    edit_res = client.put(f"/api/v1/donations/{don_id}", json={"title": "Unauthorized"}, headers=auth_tokens["unverified_donor"])
    assert edit_res.status_code == 403

    # Another donor tries to withdraw
    withdraw_res = client.post(f"/api/v1/donations/{don_id}/withdraw", headers=auth_tokens["unverified_donor"])
    assert withdraw_res.status_code == 403

def test_cross_organization_request_approval_blocked(client, auth_tokens):
    """Verify Donor B cannot approve or reject claims on Donor A's donation."""
    import datetime
    from backend.utils.time_utils import utc_now
    now = utc_now()
    payload = {
        "title": "Donor A Surplus Bread",
        "description": "Fresh loaves.",
        "category": "BAKERY_BREAD",
        "quantity": 15,
        "total_portions": 15,
        "collection_deadline": (now + datetime.timedelta(hours=3)).isoformat(),
        "storage_conditions": "AMBIENT",
        "status": "PUBLISHED"
    }
    don_res = client.post("/api/v1/donations", json=payload, headers=auth_tokens["donor"])
    don_id = don_res.json["donation"]["id"]

    claim_res = client.post(f"/api/v1/requests/donations/{don_id}", json={"requested_portions": 5}, headers=auth_tokens["receiver"])
    assert claim_res.status_code == 201
    req_id = claim_res.json["request"]["id"]

    # Another donor tries to approve
    approve_res = client.post(f"/api/v1/requests/{req_id}/approve", headers=auth_tokens["unverified_donor"])
    assert approve_res.status_code == 403

    # Another donor tries to reject
    reject_res = client.post(f"/api/v1/requests/{req_id}/reject", headers=auth_tokens["unverified_donor"])
    assert reject_res.status_code == 403
