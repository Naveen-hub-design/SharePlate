from flask import request
from backend.extensions import db
from backend.models.audit_log import AuditLog

class AuditService:
    @staticmethod
    def log_event(
        action: str,
        entity_type: str,
        entity_id: int = None,
        user_id: int = None,
        details: dict = None
    ) -> AuditLog:
        """
        Records an auditable security or business lifecycle event.
        Extracts client IP safely.
        """
        client_ip = None
        try:
            if request:
                client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
                if client_ip and "," in client_ip:
                    client_ip = client_ip.split(",")[0].strip()
        except Exception:
            pass
            
        audit = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            ip_address=client_ip,
            details=details or {}
        )
        db.session.add(audit)
        db.session.commit()
        return audit
