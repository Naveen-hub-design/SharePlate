import datetime
from backend.app import create_app
from backend.extensions import db
from backend.models import (
    User,
    Organization,
    OrganizationVerificationRecord,
    Donation,
    DonationRequest,
    PickupRecord,
    Notification,
    SafetyReport,
    AuditLog
)

def seed():
    app = create_app()
    with app.app_context():
        print("Creating all tables in MySQL...")
        db.create_all()
        
        now = datetime.datetime.utcnow()
        
        # 1. Admin Account
        admin = User.query.filter_by(email="admin@shareplate.org").first()
        if not admin:
            admin = User(
                email="admin@shareplate.org",
                full_name="Platform Safety Admin",
                role="ADMIN",
                status="ACTIVE"
            )
            admin.set_password("AdminSecure2026!")
            db.session.add(admin)
            db.session.flush()
            print("Seeded Admin: admin@shareplate.org / AdminSecure2026!")
            
        # 2. Donors
        donors_data = [
            {
                "email": "donor.taj@shareplate.org",
                "name": "Taj Grand Banquet & Caterers",
                "full_name": "Vikram Malhotra",
                "phone": "+91 98450 11223",
                "type": "CATERER",
                "fssai": "11220334000123",
                "address": "45 M.G. Road, Central District",
                "city": "Bangalore",
                "state": "Karnataka",
                "postal_code": "560001",
                "lat": 12.9716,
                "lng": 77.5946,
                "status": "VERIFIED"
            },
            {
                "email": "donor.artisan@shareplate.org",
                "name": "Artisan Crust Boulangerie",
                "full_name": "Ayesha Khan",
                "phone": "+91 98450 44556",
                "type": "BAKERY",
                "fssai": "11220334000456",
                "address": "100ft Road, Indiranagar",
                "city": "Bangalore",
                "state": "Karnataka",
                "postal_code": "560038",
                "lat": 12.9784,
                "lng": 77.6408,
                "status": "VERIFIED"
            },
            {
                "email": "donor.biryani@shareplate.org",
                "name": "Biryani Central Kitchen",
                "full_name": "Rohan Deshmukh",
                "phone": "+91 98450 77889",
                "type": "RESTAURANT",
                "fssai": "11220334000789",
                "address": "80ft Road, 4th Block Koramangala",
                "city": "Bangalore",
                "state": "Karnataka",
                "postal_code": "560034",
                "lat": 12.9352,
                "lng": 77.6245,
                "status": "VERIFIED"
            },
            {
                "email": "donor.pending@shareplate.org",
                "name": "Fresh Harvest Cafe",
                "full_name": "Kavita Rao",
                "phone": "+91 98450 99001",
                "type": "RESTAURANT",
                "fssai": "11220334000999",
                "address": "Sector 2, HSR Layout",
                "city": "Bangalore",
                "state": "Karnataka",
                "postal_code": "560102",
                "lat": 12.9116,
                "lng": 77.6388,
                "status": "PENDING"
            }
        ]
        
        donor_users = {}
        for d in donors_data:
            user = User.query.filter_by(email=d["email"]).first()
            if not user:
                user = User(
                    email=d["email"],
                    full_name=d["full_name"],
                    phone=d["phone"],
                    role="DONOR",
                    status="ACTIVE"
                )
                user.set_password("DonorPassword123!")
                db.session.add(user)
                db.session.flush()
                
                org = Organization(
                    user_id=user.id,
                    name=d["name"],
                    type=d["type"],
                    fssai_license=d["fssai"],
                    contact_person=d["full_name"],
                    contact_phone=d["phone"],
                    contact_email=d["email"],
                    address=d["address"],
                    city=d["city"],
                    state=d["state"],
                    postal_code=d["postal_code"],
                    latitude=d["lat"],
                    longitude=d["lng"],
                    verification_status=d["status"],
                    verification_notes="Verified via FSSAI central database." if d["status"] == "VERIFIED" else "Awaiting review",
                    capacity_info={"daily_surplus_portions": 80}
                )
                db.session.add(org)
                db.session.flush()
                
                if d["status"] == "VERIFIED":
                    rec = OrganizationVerificationRecord(
                        organization_id=org.id,
                        reviewer_id=admin.id,
                        previous_status="PENDING",
                        new_status="VERIFIED",
                        notes="FSSAI registration license confirmed active and valid.",
                        reviewed_at=now - datetime.timedelta(days=10)
                    )
                    db.session.add(rec)
            donor_users[d["email"]] = user
            
        # 3. Receivers
        receivers_data = [
            {
                "email": "receiver.hope@shareplate.org",
                "name": "Hope Community Kitchen & Shelter",
                "full_name": "Sister Maria Fernandez",
                "phone": "+91 98451 11222",
                "type": "SHELTER",
                "reg_no": "NGO-KA-2018-0912",
                "address": "12 Richmond Town Road",
                "city": "Bangalore",
                "state": "Karnataka",
                "postal_code": "560025",
                "lat": 12.9620,
                "lng": 77.6000,
                "status": "VERIFIED",
                "capacity": {"servings_per_day": 350, "has_cold_storage": True, "has_transport": True}
            },
            {
                "email": "receiver.feeding@shareplate.org",
                "name": "Feeding Bangalore Foundation",
                "full_name": "Arjun Nair",
                "phone": "+91 98451 33444",
                "type": "COMMUNITY_KITCHEN",
                "reg_no": "NGO-KA-2020-4411",
                "address": "22nd Main, BTM Layout 2nd Stage",
                "city": "Bangalore",
                "state": "Karnataka",
                "postal_code": "560076",
                "lat": 12.9160,
                "lng": 77.6100,
                "status": "VERIFIED",
                "capacity": {"servings_per_day": 500, "has_cold_storage": True, "has_transport": True}
            },
            {
                "email": "receiver.new@shareplate.org",
                "name": "Care Community Pantry",
                "full_name": "Sneha Sen",
                "phone": "+91 98451 55666",
                "type": "NGO",
                "reg_no": "NGO-KA-2026-8800",
                "address": "Sarjapur Road",
                "city": "Bangalore",
                "state": "Karnataka",
                "postal_code": "560035",
                "lat": 12.9250,
                "lng": 77.6800,
                "status": "PENDING",
                "capacity": {"servings_per_day": 100, "has_cold_storage": False, "has_transport": False}
            }
        ]
        
        receiver_users = {}
        for r in receivers_data:
            user = User.query.filter_by(email=r["email"]).first()
            if not user:
                user = User(
                    email=r["email"],
                    full_name=r["full_name"],
                    phone=r["phone"],
                    role="RECEIVER",
                    status="ACTIVE"
                )
                user.set_password("ReceiverPassword123!")
                db.session.add(user)
                db.session.flush()
                
                org = Organization(
                    user_id=user.id,
                    name=r["name"],
                    type=r["type"],
                    registration_number=r["reg_no"],
                    contact_person=r["full_name"],
                    contact_phone=r["phone"],
                    contact_email=r["email"],
                    address=r["address"],
                    city=r["city"],
                    state=r["state"],
                    postal_code=r["postal_code"],
                    latitude=r["lat"],
                    longitude=r["lng"],
                    verification_status=r["status"],
                    verification_notes="Verified NGO registration." if r["status"] == "VERIFIED" else "Document verification in queue",
                    capacity_info=r["capacity"]
                )
                db.session.add(org)
                db.session.flush()
                
                if r["status"] == "VERIFIED":
                    rec = OrganizationVerificationRecord(
                        organization_id=org.id,
                        reviewer_id=admin.id,
                        previous_status="PENDING",
                        new_status="VERIFIED",
                        notes="12A/80G NGO certification and physical shelter verified.",
                        reviewed_at=now - datetime.timedelta(days=15)
                    )
                    db.session.add(rec)
            receiver_users[r["email"]] = user
            
        db.session.commit()
        
        # 4. Seed Donations
        taj_user = donor_users["donor.taj@shareplate.org"]
        artisan_user = donor_users["donor.artisan@shareplate.org"]
        biryani_user = donor_users["donor.biryani@shareplate.org"]
        hope_user = receiver_users["receiver.hope@shareplate.org"]
        feeding_user = receiver_users["receiver.feeding@shareplate.org"]
        
        if Donation.query.count() == 0:
            # Active Listing 1: Cooked meals (Taj)
            d1 = Donation(
                donor_id=taj_user.id,
                organization_id=taj_user.organization.id,
                title="45 Portions Paneer Butter Masala & Peas Pulao",
                description="Freshly prepared catered banquet surplus. Maintained continuously in food-grade insulated hot-holding dispensers.",
                category="COOKED_MEALS",
                photo_url="",
                quantity=45,
                unit="portions",
                total_portions=45,
                reserved_portions=0,
                collected_portions=0,
                preparation_time=now - datetime.timedelta(hours=1),
                available_from=now,
                collection_deadline=now + datetime.timedelta(hours=3),
                allergens=["milk"],
                storage_conditions="HOT_HOLD",
                food_safety_notes="Holding temperature verified at 65°C. Clean thermal carriers required upon pickup.",
                donor_contact_phone=taj_user.phone,
                collection_address=taj_user.organization.address,
                latitude=taj_user.organization.latitude,
                longitude=taj_user.organization.longitude,
                status="PUBLISHED"
            )
            db.session.add(d1)
            
            # Active Listing 2: Bakery (Artisan Crust)
            d2 = Donation(
                donor_id=artisan_user.id,
                organization_id=artisan_user.organization.id,
                title="60 Assorted Sourdough Batards & Multigrain Loaves",
                description="Day-end artisan bakery surplus. Freshly baked this morning, packed in breathable food-grade paper bags.",
                category="BAKERY_BREAD",
                photo_url="",
                quantity=60,
                unit="packages",
                total_portions=60,
                reserved_portions=0,
                collected_portions=0,
                preparation_time=now - datetime.timedelta(hours=8),
                available_from=now,
                collection_deadline=now + datetime.timedelta(hours=24),
                allergens=["gluten"],
                storage_conditions="AMBIENT",
                food_safety_notes="Store in a cool dry area. Consume or freeze within 48 hours.",
                donor_contact_phone=artisan_user.phone,
                collection_address=artisan_user.organization.address,
                latitude=artisan_user.organization.latitude,
                longitude=artisan_user.organization.longitude,
                status="PUBLISHED"
            )
            db.session.add(d2)
            
            # Active Listing 3: Fresh Produce
            d3 = Donation(
                donor_id=biryani_user.id,
                organization_id=biryani_user.organization.id,
                title="30 kg Fresh Farm Produce (Tomatoes, Capsicum, Potatoes)",
                description="Surplus premium raw vegetables from prep kitchen. Washed and sorted in crates, ideal for community kitchen cooking.",
                category="FRESH_PRODUCE",
                photo_url="",
                quantity=30,
                unit="kg",
                total_portions=75,
                reserved_portions=0,
                collected_portions=0,
                available_from=now,
                collection_deadline=now + datetime.timedelta(hours=36),
                allergens=[],
                storage_conditions="AMBIENT",
                food_safety_notes="Raw produce. Wash thoroughly before meal preparation.",
                donor_contact_phone=biryani_user.phone,
                collection_address=biryani_user.organization.address,
                latitude=biryani_user.organization.latitude,
                longitude=biryani_user.organization.longitude,
                status="PUBLISHED"
            )
            db.session.add(d3)
            
            # Reserved Listing 4: Biryani Central with approved claim by Hope Shelter
            d4 = Donation(
                donor_id=biryani_user.id,
                organization_id=biryani_user.organization.id,
                title="50 Portions Vegetable Dum Biryani & Mirchi Ka Salan",
                description="Delicious aromatic Dum Biryani packed in sealed catering containers.",
                category="COOKED_MEALS",
                photo_url="",
                quantity=50,
                unit="portions",
                total_portions=50,
                reserved_portions=50,
                collected_portions=0,
                preparation_time=now - datetime.timedelta(hours=1, minutes=30),
                available_from=now,
                collection_deadline=now + datetime.timedelta(hours=2),
                allergens=["tree_nuts", "milk"],
                storage_conditions="HOT_HOLD",
                food_safety_notes="Holding at 62°C. Handover OTP required upon arrival.",
                donor_contact_phone=biryani_user.phone,
                collection_address=biryani_user.organization.address,
                latitude=biryani_user.organization.latitude,
                longitude=biryani_user.organization.longitude,
                status="RESERVED"
            )
            db.session.add(d4)
            db.session.flush()
            
            req4 = DonationRequest(
                donation_id=d4.id,
                receiver_id=hope_user.id,
                receiver_organization_id=hope_user.organization.id,
                requested_portions=50,
                status="APPROVED",
                pickup_code="482910",
                collection_deadline=d4.collection_deadline,
                approved_at=now - datetime.timedelta(minutes=30),
                approved_by=biryani_user.id,
                request_notes="Our shelter van is en route for pickup."
            )
            db.session.add(req4)
            
            # Completed Listing 5: Taj Caterers collected by Feeding Bangalore Foundation
            d5 = Donation(
                donor_id=taj_user.id,
                organization_id=taj_user.organization.id,
                title="100 Portions Dal Makhani, Mixed Vegetable & Rice",
                description="Surplus from afternoon corporate banquet. Fully collected and served to homeless community shelters.",
                category="COOKED_MEALS",
                photo_url="",
                quantity=100,
                unit="portions",
                total_portions=100,
                reserved_portions=0,
                collected_portions=100,
                preparation_time=now - datetime.timedelta(days=1, hours=6),
                available_from=now - datetime.timedelta(days=1, hours=4),
                collection_deadline=now - datetime.timedelta(days=1, hours=1),
                allergens=["milk"],
                storage_conditions="HOT_HOLD",
                donor_contact_phone=taj_user.phone,
                collection_address=taj_user.organization.address,
                latitude=taj_user.organization.latitude,
                longitude=taj_user.organization.longitude,
                status="COMPLETED"
            )
            db.session.add(d5)
            db.session.flush()
            
            req5 = DonationRequest(
                donation_id=d5.id,
                receiver_id=feeding_user.id,
                receiver_organization_id=feeding_user.organization.id,
                requested_portions=100,
                status="PICKED_UP",
                pickup_code="918234",
                collection_deadline=d5.collection_deadline,
                approved_at=now - datetime.timedelta(days=1, hours=3),
                approved_by=taj_user.id
            )
            db.session.add(req5)
            db.session.flush()
            
            pickup5 = PickupRecord(
                donation_id=d5.id,
                request_id=req5.id,
                receiver_id=feeding_user.id,
                donor_id=taj_user.id,
                confirmed_portions=100,
                verification_method="OTP_PIN",
                temperature_at_collection=64.5,
                safety_checklist_verified=True,
                pickup_notes="Food received hot, packaging intact. Distributed at BTM community center.",
                collected_at=now - datetime.timedelta(days=1, hours=2)
            )
            db.session.add(pickup5)
            
            # Initial Notifications
            n1 = Notification(
                user_id=hope_user.id,
                title="Donation Request Approved!",
                message="Your request for 50 portions of '50 Portions Vegetable Dum Biryani' was approved. Pickup OTP is 482910.",
                type="APPROVAL",
                link="/dashboard/pickups",
                is_read=False
            )
            db.session.add(n1)
            
            # Initial Audit Log
            a1 = AuditLog(
                user_id=admin.id,
                action="PLATFORM_INITIALIZED",
                entity_type="System",
                entity_id=1,
                details={"seed_version": "1.0", "fssai_mode": "strict"}
            )
            db.session.add(a1)
            
            db.session.commit()
            print("Seeded demo donations, requests, pickups, and notifications successfully!")
        else:
            print("Existing donations found, skipping donation seed.")
            
if __name__ == "__main__":
    seed()
