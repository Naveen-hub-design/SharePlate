import io
import time
import json
import datetime
from backend.app import create_app
from backend.config import TestConfig
from backend.extensions import db
from backend.models import User, Organization, Donation, DonationRequest, Notification, SafetyReport
from backend.utils.time_utils import utc_now

def run_endpoint_audit():
    print("=" * 80)
    print("  SHAREPLATE PRO — COMPREHENSIVE ENDPOINT VERIFICATION SUITE")
    print("=" * 80)
    
    app = create_app(TestConfig)
    client = app.test_client()
    
    results = []
    
    with app.app_context():
        # Ensure tables exist
        db.create_all()
        # Clean test database
        db.session.execute(db.text("SET FOREIGN_KEY_CHECKS = 0;"))
        for tbl in [
            "pickup_records", "donation_requests", "donations",
            "organization_verification_records", "safety_reports",
            "notifications", "audit_logs", "organizations", "users"
        ]:
            try:
                db.session.execute(db.text(f"DELETE FROM {tbl};"))
            except Exception:
                pass
        db.session.execute(db.text("SET FOREIGN_KEY_CHECKS = 1;"))
        db.session.commit()
        
        # 1. Create baseline accounts
        admin = User(email="admin.audit@shareplate.org", full_name="Super Admin", role="ADMIN", status="ACTIVE")
        admin.set_password("AdminPass123!")
        db.session.add(admin)
        
        donor = User(email="donor.audit@shareplate.org", full_name="Chef Ramesh", role="DONOR", status="ACTIVE", phone="+91 9845012345")
        donor.set_password("DonorPass123!")
        db.session.add(donor)
        
        receiver = User(email="receiver.audit@shareplate.org", full_name="Sister Mary", role="RECEIVER", status="ACTIVE", phone="+91 9845098765")
        receiver.set_password("ReceiverPass123!")
        db.session.add(receiver)
        
        db.session.flush()
        
        donor_org = Organization(
            user_id=donor.id,
            name="Grand Palace Banquets",
            type="CATERER",
            fssai_license="11223344556677",
            address="12 MG Road",
            city="Bangalore",
            state="Karnataka",
            postal_code="560001",
            latitude=12.9716,
            longitude=77.5946,
            verification_status="VERIFIED"
        )
        db.session.add(donor_org)
        
        receiver_org = Organization(
            user_id=receiver.id,
            name="Asha Community Kitchen",
            type="SHELTER",
            address="45 Residency Road",
            city="Bangalore",
            state="Karnataka",
            postal_code="560025",
            latitude=12.9650,
            longitude=77.6000,
            verification_status="VERIFIED"
        )
        db.session.add(receiver_org)
        db.session.commit()
        
        # Helper to log test result
        def check(endpoint_name, method, url, expected_status, headers=None, json_data=None, data=None):
            t0 = time.time()
            m = method.upper()
            if m == "GET":
                res = client.get(url, headers=headers)
            elif m == "POST":
                res = client.post(url, headers=headers, json=json_data, data=data)
            elif m == "PUT":
                res = client.put(url, headers=headers, json=json_data, data=data)
            elif m == "DELETE":
                res = client.delete(url, headers=headers)
            else:
                raise ValueError(f"Unknown method {m}")
            latency_ms = round((time.time() - t0) * 1000, 1)
            
            status = res.status_code
            passed = (status in expected_status) if isinstance(expected_status, list) else (status == expected_status)
            
            # Extract sample summary
            body_snippet = ""
            try:
                j = res.get_json()
                if isinstance(j, dict):
                    body_snippet = j.get("message") or j.get("status") or j.get("error") or str(list(j.keys())[:3])
                elif isinstance(j, list):
                    body_snippet = f"List len={len(j)}"
            except Exception:
                body_snippet = res.data.decode('utf-8', errors='ignore')[:30]
                
            entry = {
                "name": endpoint_name,
                "method": m,
                "url": url,
                "expected": expected_status,
                "actual": status,
                "latency_ms": latency_ms,
                "passed": passed,
                "summary": str(body_snippet)[:45]
            }
            results.append(entry)
            mark = "PASS" if passed else "FAIL"
            print(f"[{mark:<4}] {m:<5} {url:<48} (got {status}, expected {expected_status}) - {latency_ms}ms")
            return res
        
        # -------------------------------------------------------------
        # MODULE 1: SYSTEM & HEALTH
        # -------------------------------------------------------------
        print("\n--- MODULE 1: System & Health ---")
        check("Health Check", "GET", "/api/v1/health", 200)

        # -------------------------------------------------------------
        # MODULE 2: AUTHENTICATION & IDENTITY
        # -------------------------------------------------------------
        print("\n--- MODULE 2: Authentication & Identity ---")
        check("Register New User", "POST", "/api/v1/auth/register", 201, json_data={
            "email": "new.user@shareplate.org",
            "password": "Password123!",
            "full_name": "New Volunteer",
            "role": "DONOR",
            "organization_name": "New Volunteer Kitchen",
            "org_type": "RESTAURANT"
        })
        
        # Login Donor
        r_donor = check("Login Donor", "POST", "/api/v1/auth/login", 200, json_data={
            "email": "donor.audit@shareplate.org",
            "password": "DonorPass123!"
        })
        donor_token = r_donor.get_json()["access_token"]
        donor_headers = {"Authorization": f"Bearer {donor_token}"}
        
        # Login Receiver
        r_rec = check("Login Receiver", "POST", "/api/v1/auth/login", 200, json_data={
            "email": "receiver.audit@shareplate.org",
            "password": "ReceiverPass123!"
        })
        receiver_token = r_rec.get_json()["access_token"]
        receiver_headers = {"Authorization": f"Bearer {receiver_token}"}
        
        # Login Admin
        r_adm = check("Login Admin", "POST", "/api/v1/auth/login", 200, json_data={
            "email": "admin.audit@shareplate.org",
            "password": "AdminPass123!"
        })
        admin_token = r_adm.get_json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        check("Get Current Profile (/me)", "GET", "/api/v1/auth/me", 200, headers=donor_headers)
        check("Update Profile", "PUT", "/api/v1/auth/profile", 200, headers=donor_headers, json_data={
            "full_name": "Chef Ramesh G.",
            "phone": "+91 9845012399"
        })
        check("Auth Logout", "POST", "/api/v1/auth/logout", 200, headers=donor_headers)

        # -------------------------------------------------------------
        # MODULE 3: ORGANIZATIONS
        # -------------------------------------------------------------
        print("\n--- MODULE 3: Organizations ---")
        check("Get My Organization", "GET", "/api/v1/organizations/my", 200, headers=donor_headers)
        check("Update My Organization", "PUT", "/api/v1/organizations/my", 200, headers=donor_headers, json_data={
            "name": "Grand Palace Banquets & Catering",
            "city": "Bangalore"
        })
        check("Get Public Organization Profile", "GET", f"/api/v1/organizations/{donor_org.id}", 200)

        # -------------------------------------------------------------
        # MODULE 4: SAFETY METADATA & GUIDELINES
        # -------------------------------------------------------------
        print("\n--- MODULE 4: Safety & Guidelines ---")
        check("Get Safety Categories & Allergens", "GET", "/api/v1/safety/categories-and-allergens", 200)
        check("Get Safety Checklist Items", "GET", "/api/v1/safety/checklist", 200)
        check("Submit Incident Safety Report", "POST", "/api/v1/safety/reports", 201, headers=receiver_headers, json_data={
            "title": "Packaging Seal Issue",
            "description": "Outer seal was loose upon inspection during intake.",
            "severity": "LOW"
        })

        # -------------------------------------------------------------
        # MODULE 5: DONATIONS LIFECYCLE
        # -------------------------------------------------------------
        print("\n--- MODULE 5: Donations Lifecycle ---")
        now = utc_now()
        donation_payload = {
            "title": "50 Portions Vegetable Biryani & Raita",
            "description": "Fresh surplus from corporate banquet. Hot-held in food-grade insulated containers.",
            "category": "COOKED_MEALS",
            "quantity": 50,
            "total_portions": 50,
            "unit": "portions",
            "storage_conditions": "HOT_HOLD",
            "preparation_time": (now - datetime.timedelta(minutes=30)).isoformat(),
            "collection_deadline": (now + datetime.timedelta(hours=3)).isoformat(),
            "special_handling_instructions": "Maintain at 60C or above. Transport in insulated warm bags.",
            "allergens": ["Dairy"],
            "status": "DRAFT"
        }
        r_don = check("Create Donation (Draft)", "POST", "/api/v1/donations", 201, headers=donor_headers, json_data=donation_payload)
        donation_id = r_don.get_json()["donation"]["id"]
        
        check("Get Donation Detail", "GET", f"/api/v1/donations/{donation_id}", 200)
        check("Update Donation", "PUT", f"/api/v1/donations/{donation_id}", 200, headers=donor_headers, json_data={
            "description": "Updated banquet surplus description."
        })
        check("Publish Donation", "POST", f"/api/v1/donations/{donation_id}/publish", 200, headers=donor_headers)
        check("Get My Donations", "GET", "/api/v1/donations/my", 200, headers=donor_headers)
        check("Public Discover Donations (All)", "GET", "/api/v1/donations", 200)
        check("Public Discover Route (/discover)", "GET", "/api/v1/donations/discover?category=COOKED_MEALS", 200)

        # Upload Donation Image
        fake_image = (io.BytesIO(b"fake image data"), "food.jpg")
        check("Upload Food Photo", "POST", "/api/v1/donations/upload-image", 200, headers=donor_headers, data={"file": fake_image})

        # -------------------------------------------------------------
        # MODULE 6: CLAIMS & REQUESTS LIFECYCLE
        # -------------------------------------------------------------
        print("\n--- MODULE 6: Claims & Requests Lifecycle ---")
        # Receiver claims 20 portions via main route
        r_claim1 = check("Create Donation Claim (20 Portions)", "POST", f"/api/v1/requests/donations/{donation_id}", 201, headers=receiver_headers, json_data={
            "requested_portions": 20,
            "request_notes": "For evening meal distribution."
        })
        request1_id = r_claim1.get_json()["request"]["id"]
        
        # Test Donation Requests Alias
        check("Get Donation Requests (/donations/<id>/requests)", "GET", f"/api/v1/donations/{donation_id}/requests", 200, headers=donor_headers)
        check("Get My Requests (/requests/my - Receiver)", "GET", "/api/v1/requests/my", 200, headers=receiver_headers)
        check("Get My Requests (/requests/my - Donor)", "GET", "/api/v1/requests/my", 200, headers=donor_headers)
        
        # Donor Approves Request 1 (Generates Handover OTP)
        r_app = check("Approve Claim Request", "POST", f"/api/v1/requests/{request1_id}/approve", 200, headers=donor_headers)
        otp_code = r_app.get_json()["request"]["pickup_code"]
        
        # Create second claim to test Reject and Cancel
        r_claim2 = check("Create Donation Claim Alias (/donations/<id>/request)", "POST", f"/api/v1/donations/{donation_id}/request", 201, headers=receiver_headers, json_data={
            "requested_portions": 10,
            "request_notes": "Second claim for shelter."
        })
        request2_id = r_claim2.get_json()["request"]["id"]
        
        # Donor Rejects Request 2
        check("Reject Claim Request", "POST", f"/api/v1/requests/{request2_id}/reject", 200, headers=donor_headers, json_data={
            "rejection_reason": "Kitchen storage capacity reached."
        })
        
        # Create third claim to test Cancel
        r_claim3 = client.post(f"/api/v1/requests/donations/{donation_id}", headers=receiver_headers, json={"requested_portions": 5})
        request3_id = r_claim3.get_json()["request"]["id"]
        check("Cancel Claim Request", "POST", f"/api/v1/requests/{request3_id}/cancel", 200, headers=receiver_headers)

        # -------------------------------------------------------------
        # MODULE 7: PICKUP VERIFICATION & HANDOVER
        # -------------------------------------------------------------
        print("\n--- MODULE 7: Pickup Verification & Handover ---")
        pickup_payload = {
            "request_id": request1_id,
            "pickup_code": otp_code,
            "safety_checklist_verified": True,
            "temperature_at_collection": 64.0,
            "pickup_notes": "Verified hot holding container and temperature."
        }
        check("Verify & Complete Pickup (/pickups/verify)", "POST", "/api/v1/pickups/verify", 200, headers=donor_headers, json_data=pickup_payload)
        check("Get Pickup History", "GET", "/api/v1/pickups/history", 200, headers=receiver_headers)
        
        # Test Duplicate Handover Replay Prevention (Expect 409 Conflict)
        check("Verify Pickup Alias - Duplicate Block (/pickups/verify-and-complete)", "POST", "/api/v1/pickups/verify-and-complete", 409, headers=donor_headers, json_data=pickup_payload)

        # -------------------------------------------------------------
        # MODULE 8: NOTIFICATIONS
        # -------------------------------------------------------------
        print("\n--- MODULE 8: Notifications ---")
        r_notif = check("Get User Notifications", "GET", "/api/v1/notifications", 200, headers=receiver_headers)
        notifs = r_notif.get_json().get("notifications", [])
        if notifs:
            notif_id = notifs[0]["id"]
            check("Mark Notification Read", "PUT", f"/api/v1/notifications/{notif_id}/read", 200, headers=receiver_headers)
        check("Mark All Notifications Read", "PUT", "/api/v1/notifications/read-all", 200, headers=receiver_headers)

        # -------------------------------------------------------------
        # MODULE 9: AI SERVICES & COPILOT
        # -------------------------------------------------------------
        print("\n--- MODULE 9: AI Services & Copilot ---")
        check("AI Listing Assistant", "POST", "/api/v1/ai/listing-assistant", 200, headers=donor_headers, json_data={
            "description": "5 trays of paneer butter masala from wedding event."
        })
        check("AI Photo Analysis", "POST", "/api/v1/ai/analyze-photo", 200, headers=donor_headers, json_data={
            "image_url": "https://example.com/food.jpg"
        })
        check("AI Matching Explanation", "POST", "/api/v1/ai/explain-match", 200, headers=donor_headers, json_data={
            "donation_id": donation_id,
            "receiver_id": receiver.id
        })

        # -------------------------------------------------------------
        # MODULE 10: ANALYTICS & METRICS
        # -------------------------------------------------------------
        print("\n--- MODULE 10: Analytics & Dashboards ---")
        check("Platform Public Impact Metrics", "GET", "/api/v1/analytics/impact", 200)
        check("Donor Operational Dashboard Metrics", "GET", "/api/v1/analytics/donor-dashboard", 200, headers=donor_headers)
        check("Receiver Impact Dashboard Metrics", "GET", "/api/v1/analytics/receiver-dashboard", 200, headers=receiver_headers)

        # -------------------------------------------------------------
        # MODULE 11: ADMIN GOVERNANCE & AUDIT LOGS
        # -------------------------------------------------------------
        print("\n--- MODULE 11: Admin Governance Portal ---")
        check("Admin Platform Overview", "GET", "/api/v1/admin/overview", 200, headers=admin_headers)
        check("Admin List Pending Verifications", "GET", "/api/v1/admin/verifications", 200, headers=admin_headers)
        check("Admin Review Verification", "POST", f"/api/v1/admin/verifications/{donor_org.id}", 200, headers=admin_headers, json_data={
            "status": "APPROVED",
            "notes": "Verified FSSAI license on government portal."
        })
        check("Admin List Users", "GET", "/api/v1/admin/users", 200, headers=admin_headers)
        check("Admin Update User Status", "PUT", f"/api/v1/admin/users/{donor.id}/status", 200, headers=admin_headers, json_data={
            "status": "ACTIVE"
        })
        check("Admin List Safety Reports", "GET", "/api/v1/admin/safety-reports", 200, headers=admin_headers)
        
        # Check first safety report if exists
        reports = SafetyReport.query.all()
        if reports:
            check("Admin Resolve Safety Report", "PUT", f"/api/v1/admin/safety-reports/{reports[0].id}", 200, headers=admin_headers, json_data={
                "status": "RESOLVED",
                "resolution_notes": "Contacted donor coordinator and verified adherence to packaging guidelines."
            })
            
        check("Admin View Audit Logs", "GET", "/api/v1/admin/audit-logs", 200, headers=admin_headers)

        # -------------------------------------------------------------
        # MODULE 12: WITHDRAWAL & STATIC ASSETS
        # -------------------------------------------------------------
        print("\n--- MODULE 12: Withdrawal & Static Assets ---")
        # Withdraw the donation
        check("Withdraw Donation", "POST", f"/api/v1/donations/{donation_id}/withdraw", 200, headers=donor_headers, json_data={
            "withdrawal_reason": "Portions distributed to local staff."
        })
        
        # Static uploads test
        check("Serve Static Upload (Nonexistent File -> 404)", "GET", "/api/v1/uploads/food/nonexistent.jpg", 404)
        check("Serve Static Upload (Invalid subfolder -> 400)", "GET", "/api/v1/uploads/malicious/file.txt", 400)

    # Summary
    print("\n" + "=" * 80)
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    failed = total - passed
    print(f"  ENDPOINT AUDIT COMPLETE: {passed}/{total} Passed ({(passed/total)*100:.1f}%)")
    print("=" * 80)
    
    # Write report json
    with open("endpoint_audit_summary.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    run_endpoint_audit()
