from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from backend.models.user import User

def get_current_authenticated_user():
    """Helper to retrieve the authenticated User model instance."""
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        if not user_id:
            return None
        user = User.query.get(int(user_id))
        return user
    except Exception:
        return None

def role_required(*allowed_roles):
    """
    RBAC decorator that validates the authenticated user role against allowed roles.
    Also ensures the user is ACTIVE and not SUSPENDED.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            
            if not user:
                return jsonify({"error": "User not found or account deactivated"}), 401
                
            if user.status != "ACTIVE":
                return jsonify({"error": "Your account has been suspended. Please contact platform administration."}), 403
                
            if allowed_roles and user.role not in allowed_roles:
                return jsonify({
                    "error": f"Access denied. Required role: {', '.join(allowed_roles)}. Your role: {user.role}"
                }), 403
                
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def verified_organization_required():
    """
    Enforces that the user belongs to a VERIFIED organization.
    - Unverified receivers cannot claim or request surplus food.
    - Unverified donors cannot publish listings.
    - Admins are exempt.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            
            if not user:
                return jsonify({"error": "User not found"}), 401
                
            if user.role == "ADMIN":
                return fn(*args, **kwargs)
                
            org = user.organization
            if not org:
                return jsonify({
                    "error": "No organization profile associated with this account. Please register an organization first."
                }), 400
                
            if org.verification_status != "VERIFIED":
                return jsonify({
                    "error": f"Organization verification required. Your current status is '{org.verification_status}'. Once verified by platform administrators, you can proceed.",
                    "verification_status": org.verification_status
                }), 403
                
            return fn(*args, **kwargs)
        return wrapper
    return decorator
