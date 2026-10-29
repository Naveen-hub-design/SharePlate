import pytest
from flask_jwt_extended import create_access_token
from backend.app import create_app
from backend.config import TestConfig
from backend.extensions import db
from backend.models import User, Organization, Donation, DonationRequest

@pytest.fixture(scope="session")
def app():
    test_app = create_app(TestConfig)
    with test_app.app_context():
        db.create_all()
        yield test_app
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope="function")
def client(app):
    with app.test_client() as test_client:
        with app.app_context():
            # Fast, lock-free delete with FK checks disabled
            is_sqlite = "sqlite" in app.config.get("SQLALCHEMY_DATABASE_URI", "")
            if is_sqlite:
                db.session.execute(db.text("PRAGMA foreign_keys = OFF;"))
            else:
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
            if is_sqlite:
                db.session.execute(db.text("PRAGMA foreign_keys = ON;"))
            else:
                db.session.execute(db.text("SET FOREIGN_KEY_CHECKS = 1;"))
            
            # Seed standard accounts
            admin = User(email="admin.test@shareplate.org", full_name="Admin User", role="ADMIN", status="ACTIVE")
            admin.set_password("AdminPass123!")
            db.session.add(admin)
            
            donor = User(email="donor.test@shareplate.org", full_name="Donor User", role="DONOR", status="ACTIVE", phone="+91 9988776655")
            donor.set_password("DonorPass123!")
            db.session.add(donor)
            db.session.flush()
            
            donor_org = Organization(
                user_id=donor.id,
                name="Test Caterers",
                type="CATERER",
                fssai_license="11223344556677",
                address="10 Brigade Road",
                city="Bangalore",
                state="Karnataka",
                postal_code="560001",
                latitude=12.9716,
                longitude=77.5946,
                verification_status="VERIFIED"
            )
            db.session.add(donor_org)
            
            unverified_donor = User(email="unverified.donor@shareplate.org", full_name="Pending Donor", role="DONOR", status="ACTIVE")
            unverified_donor.set_password("DonorPass123!")
            db.session.add(unverified_donor)
            db.session.flush()
            
            unverified_donor_org = Organization(
                user_id=unverified_donor.id,
                name="Unverified Diner",
                type="RESTAURANT",
                address="20 Indiranagar",
                city="Bangalore",
                state="Karnataka",
                postal_code="560038",
                verification_status="PENDING"
            )
            db.session.add(unverified_donor_org)
            
            receiver = User(email="receiver.test@shareplate.org", full_name="Receiver User", role="RECEIVER", status="ACTIVE")
            receiver.set_password("ReceiverPass123!")
            db.session.add(receiver)
            db.session.flush()
            
            receiver_org = Organization(
                user_id=receiver.id,
                name="Community Food Bank",
                type="COMMUNITY_KITCHEN",
                registration_number="NGO-12345",
                address="30 Koramangala",
                city="Bangalore",
                state="Karnataka",
                postal_code="560034",
                latitude=12.9352,
                longitude=77.6245,
                verification_status="VERIFIED",
                capacity_info={"servings_per_day": 300, "has_cold_storage": True}
            )
            db.session.add(receiver_org)
            
            unverified_receiver = User(email="unverified.receiver@shareplate.org", full_name="Pending Receiver", role="RECEIVER", status="ACTIVE")
            unverified_receiver.set_password("ReceiverPass123!")
            db.session.add(unverified_receiver)
            db.session.flush()
            
            unverified_receiver_org = Organization(
                user_id=unverified_receiver.id,
                name="New Shelter",
                type="SHELTER",
                address="40 BTM",
                city="Bangalore",
                state="Karnataka",
                postal_code="560076",
                verification_status="PENDING"
            )
            db.session.add(unverified_receiver_org)
            
            db.session.commit()
            db.session.remove()
        yield test_client

@pytest.fixture(scope="function")
def auth_tokens(client, app):
    """Retrieves fresh tokens for the seeded accounts in this test run."""
    with app.app_context():
        admin = User.query.filter_by(email="admin.test@shareplate.org").first()
        donor = User.query.filter_by(email="donor.test@shareplate.org").first()
        unverified_donor = User.query.filter_by(email="unverified.donor@shareplate.org").first()
        receiver = User.query.filter_by(email="receiver.test@shareplate.org").first()
        unverified_receiver = User.query.filter_by(email="unverified.receiver@shareplate.org").first()
        
        tokens = {
            "admin": {"Authorization": f"Bearer {create_access_token(identity=str(admin.id))}"},
            "donor": {"Authorization": f"Bearer {create_access_token(identity=str(donor.id))}"},
            "unverified_donor": {"Authorization": f"Bearer {create_access_token(identity=str(unverified_donor.id))}"},
            "receiver": {"Authorization": f"Bearer {create_access_token(identity=str(receiver.id))}"},
            "unverified_receiver": {"Authorization": f"Bearer {create_access_token(identity=str(unverified_receiver.id))}"},
        }
        db.session.remove()
        return tokens
