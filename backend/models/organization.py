import datetime
from backend.extensions import db

class Organization(db.Model):
    __tablename__ = "organizations"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # RESTAURANT, BAKERY, CATERER, EVENT_ORGANIZER, NGO, SHELTER, COMMUNITY_KITCHEN, OTHER
    registration_number = db.Column(db.String(100), nullable=True)
    fssai_license = db.Column(db.String(100), nullable=True, index=True) # 14-digit FSSAI license / registration
    contact_person = db.Column(db.String(150), nullable=True)
    contact_email = db.Column(db.String(191), nullable=True)
    contact_phone = db.Column(db.String(30), nullable=True)
    address = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(100), nullable=False, index=True)
    state = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    # PENDING, VERIFIED, REJECTED
    verification_status = db.Column(db.String(20), nullable=False, default="PENDING", index=True)
    verification_notes = db.Column(db.Text, nullable=True)
    
    # Structured capacity: e.g. {"servings_per_day": 200, "has_cold_storage": true, "has_transport": true}
    capacity_info = db.Column(db.JSON, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
    
    # Relationships
    donations = db.relationship("Donation", backref="organization", lazy="dynamic", foreign_keys="Donation.organization_id")
    verification_records = db.relationship("OrganizationVerificationRecord", backref="organization", lazy="dynamic", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "type": self.type,
            "registration_number": self.registration_number,
            "fssai_license": self.fssai_license,
            "contact_person": self.contact_person,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "postal_code": self.postal_code,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "verification_status": self.verification_status,
            "verification_notes": self.verification_notes,
            "capacity_info": self.capacity_info or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class OrganizationVerificationRecord(db.Model):
    __tablename__ = "organization_verification_records"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    previous_status = db.Column(db.String(20), nullable=False)
    new_status = db.Column(db.String(20), nullable=False)
    notes = db.Column(db.Text, nullable=False)
    reviewed_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    
    reviewer = db.relationship("User", foreign_keys=[reviewer_id])
    
    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "reviewer_id": self.reviewer_id,
            "reviewer_name": self.reviewer.full_name if self.reviewer else "System Admin",
            "previous_status": self.previous_status,
            "new_status": self.new_status,
            "notes": self.notes,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
        }
