import datetime
from backend.extensions import db

class Donation(db.Model):
    __tablename__ = "donations"
    
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
    
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
    
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
        return datetime.datetime.utcnow() > self.collection_deadline
        
    def to_dict(self):
        return {
            "id": self.id,
            "donor_id": self.donor_id,
            "organization_id": self.organization_id,
            "donor_name": self.donor_user.full_name if self.donor_user else None,
            "organization_name": self.organization.name if self.organization else None,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "photo_url": self.photo_url,
            "quantity": self.quantity,
            "unit": self.unit,
            "total_portions": self.total_portions,
            "reserved_portions": self.reserved_portions,
            "collected_portions": self.collected_portions,
            "remaining_portions": self.remaining_portions,
            "preparation_time": self.preparation_time.isoformat() if self.preparation_time else None,
            "packaging_time": self.packaging_time.isoformat() if self.packaging_time else None,
            "available_from": self.available_from.isoformat() if self.available_from else None,
            "collection_deadline": self.collection_deadline.isoformat() if self.collection_deadline else None,
            "allergens": self.allergens or [],
            "storage_conditions": self.storage_conditions,
            "food_safety_notes": self.food_safety_notes,
            "donor_contact_phone": self.donor_contact_phone,
            "collection_address": self.collection_address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "status": self.status,
            "is_expired": self.is_expired,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
