def test_non_admin_forbidden_from_admin_verifications(client, auth_tokens):
    res = client.get("/api/v1/admin/verifications", headers=auth_tokens["donor"])
    assert res.status_code == 403
    assert "Access denied" in res.json["error"]

def test_admin_approves_organization_verification(client, auth_tokens):
    # 1. Admin lists pending organizations
    list_res = client.get("/api/v1/admin/verifications?status=PENDING", headers=auth_tokens["admin"])
    assert list_res.status_code == 200
    pending_orgs = list_res.json["organizations"]
    assert len(pending_orgs) >= 1
    
    target_org = pending_orgs[0]
    org_id = target_org["id"]
    
    # 2. Admin reviews and approves
    review_res = client.post(
        f"/api/v1/admin/verifications/{org_id}",
        json={"decision": "VERIFIED", "notes": "FSSAI License verified against official portal."},
        headers=auth_tokens["admin"]
    )
    assert review_res.status_code == 200
    assert review_res.json["organization"]["verification_status"] == "VERIFIED"

def test_admin_suspend_and_block_user(client, auth_tokens):
    # Admin gets user list
    users_res = client.get("/api/v1/admin/users", headers=auth_tokens["admin"])
    assert users_res.status_code == 200
    donor_user = next(u for u in users_res.json["users"] if u["role"] == "DONOR")
    
    # Suspend donor
    suspend_res = client.put(
        f"/api/v1/admin/users/{donor_user['id']}/status",
        json={"status": "SUSPENDED", "reason": "Investigation into food safety report"},
        headers=auth_tokens["admin"]
    )
    assert suspend_res.status_code == 200
    assert suspend_res.json["user"]["status"] == "SUSPENDED"
    
    # Suspended donor cannot perform authenticated action
    action_res = client.get("/api/v1/donations", headers=auth_tokens["donor"])
    # Note: public discover donations works without token or with token, but creating donation should be 403
    create_res = client.post("/api/v1/donations", json={}, headers=auth_tokens["donor"])
    assert create_res.status_code == 403
    assert "suspended" in create_res.json["error"].lower()

def test_public_impact_metrics(client):
    res = client.get("/api/v1/analytics/impact")
    assert res.status_code == 200
    assert "metrics" in res.json
    assert "methodology" in res.json
    assert "estimated_meals_rescued" in res.json["metrics"]
    assert "estimated_co2e_saved_kg" in res.json["metrics"]
