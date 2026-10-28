import datetime
from backend.extensions import db
from backend.utils.time_utils import utc_now

class SafetyReport(db.Model):
    __tablename__ = "safety_reports"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    reporter_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    donation_id = db.Column(db.Integer, db.ForeignKey("donations.id", ondelete="SET NULL"), nullable=True, index=True)
    reported_organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Types: SPOILED_FOOD, MISLABELED_ALLERGENS, HYGIENE_VIOLATION, TEMPERATURE_ABUSE, PACKAGING_DAMAGE, FRAUD, OTHER
    issue_type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    evidence_urls = db.Column(db.JSON, nullable=True) # list of file links
    
    # Status: OPEN, UNDER_INVESTIGATION, RESOLVED, DISMISSED
    status = db.Column(db.String(30), nullable=False, default="OPEN", index=True)
    admin_notes = db.Column(db.Text, nullable=True)
    resolved_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    # Relationships
    reporter = db.relationship("User", foreign_keys=[reporter_id])
    resolver = db.relationship("User", foreign_keys=[resolved_by])
    reported_organization = db.relationship("Organization", foreign_keys=[reported_organization_id])
    
    def to_dict(self):
        return {
            "id": self.id,
            "reporter_id": self.reporter_id,
            "reporter_name": self.reporter.full_name if self.reporter else None,
            "donation_id": self.donation_id,
            "donation_title": self.donation.title if self.donation else None,
            "reported_organization_id": self.reported_organization_id,
            "reported_organization_name": self.reported_organization.name if self.reported_organization else None,
            "issue_type": self.issue_type,
            "description": self.description,
            "evidence_urls": self.evidence_urls or [],
            "status": self.status,
            "admin_notes": self.admin_notes,
            "resolved_by_name": self.resolver.full_name if self.resolver else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
