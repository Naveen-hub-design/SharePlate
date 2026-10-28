import datetime
from backend.extensions import db
from backend.utils.time_utils import utc_now

def mask_phone_number(phone: str) -> str:
    if not phone or len(phone) < 6:
        return "+91 ••••• •••••"
    # Keep first 5 and last 2 characters
    cleaned = phone.strip()
    return f"{cleaned[:5]} •••• {cleaned[-2:]}"

def mask_email_address(email: str) -> str:
    if not email or "@" not in email:
        return "•••••@shareplate.org"
    user_part, domain = email.split("@", 1)
    if len(user_part) <= 2:
        return f"{user_part[0]}*@{domain}"
    return f"{user_part[0]}•••{user_part[-1]}@{domain}"

class Donation(db.Model):
    __tablename__ = "donations"
    
    __table_args__ = (
        db.Index("idx_donation_status_deadline", "status", "collection_deadline"),
        db.Index("idx_donation_donor_status", "donor_id", "status"),
        db.Index("idx_donation_category_status", "category", "status"),
    )
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    donor_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    # Categories: COOKED_MEALS, PACKAGED_GOODS, BAKERY_BREAD, FRESH_PRODUCE, DAIRY, BEVERAGES, OTHER
    category = db.Column(db.String(50), nullable=False, index=True)
    photo_url = db.Column(db.String(500), nullable=True)
    
    # Original quantity and unit
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(30), nullable=False) # 'portions', 'kg', 'packages', 'liters', 'boxes'
    
    # Portions tracking for partial claims and concurrency safety
    total_portions = db.Column(db.Integer, nullable=False)
    reserved_portions = db.Column(db.Integer, nullable=False, default=0)
    collected_portions = db.Column(db.Integer, nullable=False, default=0)
    
    # Timing and FSSAI safety criteria
    preparation_time = db.Column(db.DateTime, nullable=True)
    packaging_time = db.Column(db.DateTime, nullable=True)
    available_from = db.Column(db.DateTime, nullable=False)
    collection_deadline = db.Column(db.DateTime, nullable=False, index=True)
    
    # Safety attributes
    allergens = db.Column(db.JSON, nullable=True) # list of allergens
    # Storage: AMBIENT, REFRIGERATED, FROZEN, HOT_HOLD
    storage_conditions = db.Column(db.String(30), nullable=False, default="AMBIENT")
    food_safety_notes = db.Column(db.Text, nullable=True)
    donor_contact_phone = db.Column(db.String(30), nullable=False)
    
    # Collection Location
    collection_address = db.Column(db.Text, nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    # State machine: DRAFT, PUBLISHED, RESERVED, COLLECTED, COMPLETED, WITHDRAWN, EXPIRED
    status = db.Column(db.String(20), nullable=False, default="DRAFT", index=True)
    
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    # Relationships
    requests = db.relationship("DonationRequest", backref="donation", lazy="dynamic", cascade="all, delete-orphan")
    pickups = db.relationship("PickupRecord", backref="donation", lazy="dynamic", cascade="all, delete-orphan")
    safety_reports = db.relationship("SafetyReport", backref="donation", lazy="dynamic")
    
    @property
    def remaining_portions(self) -> int:
        return max(0, self.total_portions - (self.reserved_portions + self.collected_portions))
        
    @property
    def is_expired(self) -> bool:
        if not self.collection_deadline:
            return False
        return utc_now() > self.collection_deadline
        
    def to_dict(self, mask_pii: bool = False):
        contact_phone = mask_phone_number(self.donor_contact_phone) if mask_pii else self.donor_contact_phone
        raw_email = self.organization.contact_email if self.organization and self.organization.contact_email else (self.donor_user.email if self.donor_user else "")
        contact_email = mask_email_address(raw_email) if mask_pii else raw_email
        
        org_contact_person = "Registered Coordinator" if mask_pii else (self.organization.contact_person if self.organization else "")
        org_contact_phone = mask_phone_number(self.organization.contact_phone) if (mask_pii and self.organization and self.organization.contact_phone) else (self.organization.contact_phone if self.organization else self.donor_contact_phone)
        org_contact_email = mask_email_address(self.organization.contact_email) if (mask_pii and self.organization and self.organization.contact_email) else (self.organization.contact_email if self.organization else "")
        
        return {
            "id": self.id,
            "donor_id": self.donor_id,
            "organization_id": self.organization_id,
            "donor_org_id": self.organization_id,
            "donor_name": self.donor_user.full_name if self.donor_user else None,
            "organization_name": self.organization.name if self.organization else None,
            "donor_organization": {
                "id": self.organization.id if self.organization else None,
                "name": self.organization.name if self.organization else "Verified Food Donor",
                "org_type": self.organization.type if self.organization else "RESTAURANT",
                "address_line": self.organization.address if self.organization else self.collection_address,
                "city": self.organization.city if self.organization else "Bangalore",
                "state": self.organization.state if self.organization else "Karnataka",
                "postal_code": self.organization.postal_code if self.organization else "560001",
                "latitude": self.organization.latitude if self.organization else self.latitude,
                "longitude": self.organization.longitude if self.organization else self.longitude,
                "contact_person": org_contact_person,
                "contact_phone": org_contact_phone,
                "contact_email": org_contact_email,
                "verification_status": self.organization.verification_status if self.organization else "VERIFIED",
                "created_at": self.organization.created_at.isoformat() if self.organization and self.organization.created_at else None,
            } if self.organization else None,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "photo_url": self.photo_url,
            "image_url": self.photo_url,
            "quantity": self.quantity,
            "unit": self.unit,
            "total_portions": self.total_portions,
            "reserved_portions": self.reserved_portions,
            "reserved_quantity": self.reserved_portions,
            "collected_portions": self.collected_portions,
            "collected_quantity": self.collected_portions,
            "remaining_portions": self.remaining_portions,
            "remaining_quantity": self.remaining_portions,
            "preparation_time": self.preparation_time.isoformat() if self.preparation_time else None,
            "cooked_or_prepared_at": self.preparation_time.isoformat() if self.preparation_time else None,
            "packaging_time": self.packaging_time.isoformat() if self.packaging_time else None,
            "available_from": self.available_from.isoformat() if self.available_from else None,
            "collection_deadline": self.collection_deadline.isoformat() if self.collection_deadline else None,
            "allergens": self.allergens or [],
            "storage_conditions": self.storage_conditions,
            "storage_condition": self.storage_conditions,
            "food_safety_notes": self.food_safety_notes,
            "special_handling_instructions": self.food_safety_notes,
            "donor_contact_phone": contact_phone,
            "donor_contact_email": contact_email,
            "collection_address": self.collection_address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "status": self.status,
            "is_perishable": self.category in ["COOKED_MEALS", "DAIRY_PRODUCTS", "RAW_MEAT_OR_SEAFOOD"],
            "is_expired": self.is_expired,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
