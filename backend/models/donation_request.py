import datetime
from backend.extensions import db
from backend.utils.time_utils import utc_now

class DonationRequest(db.Model):
    __tablename__ = "donation_requests"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    donation_id = db.Column(db.Integer, db.ForeignKey("donations.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    requested_portions = db.Column(db.Integer, nullable=False)
    # Status: PENDING, APPROVED, REJECTED, CANCELLED, PICKED_UP
    status = db.Column(db.String(20), nullable=False, default="PENDING", index=True)
    
    request_notes = db.Column(db.Text, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    
    # 6-digit secure handover verification OTP generated upon approval
    pickup_code = db.Column(db.String(10), nullable=True)
    collection_deadline = db.Column(db.DateTime, nullable=True)
    
    approved_at = db.Column(db.DateTime, nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    # Relationships
    receiver_organization = db.relationship("Organization", foreign_keys=[receiver_organization_id])
    approver = db.relationship("User", foreign_keys=[approved_by])
    pickup_record = db.relationship("PickupRecord", backref="request", uselist=False, cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "donation_id": self.donation_id,
            "donation_title": self.donation.title if self.donation else None,
            "donation": self.donation.to_dict() if self.donation else None,
            "receiver_id": self.receiver_id,
            "receiver_name": self.receiver_user.full_name if self.receiver_user else None,
            "receiver_user": {
                "id": self.receiver_user.id,
                "full_name": self.receiver_user.full_name,
                "email": self.receiver_user.email,
                "phone": self.receiver_user.phone,
            } if self.receiver_user else None,
            "receiver_organization_id": self.receiver_organization_id,
            "receiver_org_id": self.receiver_organization_id,
            "receiver_organization_name": self.receiver_organization.name if self.receiver_organization else None,
            "receiver_organization": self.receiver_organization.to_dict() if self.receiver_organization else None,
            "requested_portions": self.requested_portions,
            "requested_quantity": self.requested_portions,
            "status": self.status,
            "request_notes": self.request_notes,
            "requester_notes": self.request_notes,
            "rejection_reason": self.rejection_reason,
            "pickup_code": self.pickup_code,
            "collection_deadline": self.collection_deadline.isoformat() if self.collection_deadline else None,
            "approved_at": self.approved_at.isoformat() if self.approved_at else None,
            "approved_by_name": self.approver.full_name if self.approver else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
