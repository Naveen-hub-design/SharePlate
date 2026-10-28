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
