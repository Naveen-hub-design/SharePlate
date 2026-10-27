import datetime
from flask import request
from backend.extensions import db
from backend.models.notification import Notification

class NotificationService:
    @staticmethod
    def send_notification(
        user_id: int,
        title: str,
        message: str,
        notif_type: str = "SYSTEM",
        link: str = None
    ) -> Notification:
        """
        Creates and persists an in-app notification.
        Prevents duplicate rapid notifications within 1 minute with identical title and user.
        """
        one_min_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=1)
        existing = Notification.query.filter(
            Notification.user_id == user_id,
            Notification.title == title,
            Notification.created_at >= one_min_ago
        ).first()
        
        if existing:
            return existing
            
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notif_type,
            link=link,
            is_read=False
        )
        db.session.add(notif)
        db.session.commit()
        return notif
