from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.notification import Notification

notification_bp = Blueprint("notifications", __name__, url_prefix="/api/v1/notifications")

@notification_bp.route("", methods=["GET"])
@jwt_required()
def get_user_notifications():
    user_id = int(get_jwt_identity())
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    
    query = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc())
    total = query.count()
    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    
    notifications = query.paginate(page=page, per_page=per_page, error_out=False).items
    
    return jsonify({
        "notifications": [n.to_dict() for n in notifications],
        "unread_count": unread_count,
        "total": total,
        "page": page,
        "per_page": per_page
    }), 200

@notification_bp.route("/<int:notif_id>/read", methods=["PUT"])
@jwt_required()
def mark_notification_read(notif_id: int):
    user_id = int(get_jwt_identity())
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first()
    if not notif:
        return jsonify({"error": "Notification not found"}), 404
        
    notif.is_read = True
    db.session.commit()
    return jsonify({"message": "Notification marked as read"}), 200

@notification_bp.route("/read-all", methods=["PUT"])
@jwt_required()
def mark_all_notifications_read():
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=user_id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "All notifications marked as read"}), 200
