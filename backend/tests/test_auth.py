def test_user_registration_success(client):
    payload = {
        "email": "fresh.donor@shareplate.org",
        "password": "SecurePassword123!",
        "full_name": "Fresh Donor",
        "phone": "+91 9123456789",
        "role": "DONOR",
        "organization": {
            "name": "Fresh Organic Kitchen",
            "type": "RESTAURANT",
            "fssai_license": "11223344556600",
            "address": "12 Residency Road",
            "city": "Bangalore",
            "state": "Karnataka",
            "postal_code": "560025"
        }
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    assert "access_token" in res.json
    assert res.json["user"]["email"] == "fresh.donor@shareplate.org"
    assert res.json["user"]["organization"]["verification_status"] == "PENDING"

def test_duplicate_registration_rejected(client, auth_tokens):
    payload = {
        "email": "donor.test@shareplate.org", # already exists in fixture
        "password": "AnotherPassword123!",
        "full_name": "Duplicate User",
        "role": "DONOR",
        "organization": {
            "name": "Another Kitchen",
            "address": "123 Street",
            "city": "Bangalore"
        }
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 409
    assert "already exists" in res.json["error"]

def test_disallow_self_registering_as_admin(client):
    payload = {
        "email": "hacker@shareplate.org",
        "password": "Password123!",
        "full_name": "Hacker",
        "role": "ADMIN",
        "organization": {
            "name": "Fake Org",
            "address": "Anywhere",
            "city": "Bangalore"
        }
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 400
    assert "Role must be DONOR or RECEIVER" in res.json["error"]

def test_login_invalid_credentials(client):
    res = client.post("/api/v1/auth/login", json={"email": "nobody@shareplate.org", "password": "wrong"})
    assert res.status_code == 401
    assert "Invalid email or password" in res.json["error"]

def test_get_current_user_profile(client, auth_tokens):
    res = client.get("/api/v1/auth/me", headers=auth_tokens["donor"])
    assert res.status_code == 200
    assert res.json["user"]["email"] == "donor.test@shareplate.org"
    assert res.json["user"]["role"] == "DONOR"
