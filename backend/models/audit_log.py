import datetime
from backend.extensions import db

class AuditLog(db.Model):
    __tablename__ = "audit_logs"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = db.Column(db.String(100), nullable=False, index=True) # e.g. DONATION_RESERVED, STATUS_CHANGED, ORG_VERIFIED
    entity_type = db.Column(db.String(50), nullable=False, index=True) # e.g. Donation, User, Organization
    entity_id = db.Column(db.Integer, nullable=True, index=True)
    ip_address = db.Column(db.String(45), nullable=True)
    details = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    
    user = db.relationship("User", foreign_keys=[user_id])
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else "System",
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "ip_address": self.ip_address,
            "details": self.details or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
