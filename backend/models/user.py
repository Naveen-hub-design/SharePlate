import datetime
import bcrypt
from backend.extensions import db

class User(db.Model):
    __tablename__ = "users"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(191), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(30), nullable=True)
    role = db.Column(db.String(20), nullable=False, default="DONOR")  # DONOR, RECEIVER, ADMIN
    status = db.Column(db.String(20), nullable=False, default="ACTIVE")  # ACTIVE, SUSPENDED
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
    
    # Relationships
    organization = db.relationship("Organization", backref="user", uselist=False, cascade="all, delete-orphan")
    donations = db.relationship("Donation", backref="donor_user", foreign_keys="Donation.donor_id", lazy="dynamic")
    requests = db.relationship("DonationRequest", backref="receiver_user", foreign_keys="DonationRequest.receiver_id", lazy="dynamic")
    notifications = db.relationship("Notification", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    
    def set_password(self, password: str):
        salt = bcrypt.gensalt(rounds=12)
        self.password_hash = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
        
    def check_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return bcrypt.checkpw(password.encode("utf-8"), self.password_hash.encode("utf-8"))
        
    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone": self.phone,
            "role": self.role,
            "status": self.status,
            "organization": self.organization.to_dict() if self.organization else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
