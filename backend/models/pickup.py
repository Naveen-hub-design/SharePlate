import datetime
from backend.extensions import db

class PickupRecord(db.Model):
    __tablename__ = "pickup_records"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    donation_id = db.Column(db.Integer, db.ForeignKey("donations.id", ondelete="CASCADE"), nullable=False, index=True)
    request_id = db.Column(db.Integer, db.ForeignKey("donation_requests.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    donor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    
    confirmed_portions = db.Column(db.Integer, nullable=False)
    verification_method = db.Column(db.String(30), nullable=False, default="OTP_PIN")
    pickup_notes = db.Column(db.Text, nullable=True)
    temperature_at_collection = db.Column(db.Float, nullable=True) # Temperature check at collection
    safety_checklist_verified = db.Column(db.Boolean, default=True, nullable=False)
    
    collected_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    
    # Relationships
    receiver = db.relationship("User", foreign_keys=[receiver_id])
    donor = db.relationship("User", foreign_keys=[donor_id])
    
    def to_dict(self):
        return {
            "id": self.id,
            "donation_id": self.donation_id,
            "donation_title": self.donation.title if self.donation else None,
            "request_id": self.request_id,
            "receiver_id": self.receiver_id,
            "receiver_name": self.receiver.full_name if self.receiver else None,
            "donor_id": self.donor_id,
            "donor_name": self.donor.full_name if self.donor else None,
            "confirmed_portions": self.confirmed_portions,
            "verification_method": self.verification_method,
            "pickup_notes": self.pickup_notes,
            "temperature_at_collection": self.temperature_at_collection,
            "safety_checklist_verified": self.safety_checklist_verified,
            "collected_at": self.collected_at.isoformat() if self.collected_at else None,
        }
