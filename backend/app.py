import os
import click
from flask import Flask, jsonify, send_from_directory
from backend.config import Config
from backend.extensions import db, migrate, jwt, cors, ma
from backend.models import User, Organization

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Ensure upload directory exists
    os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "food"), exist_ok=True)
    os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "evidence"), exist_ok=True)
    
    # Initialize extensions
    db.init_app(app)
    with app.app_context():
        import backend.models
        db.create_all()
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:3000")
    origins_list = [o.strip() for o in cors_origins.split(",") if o.strip()]
    cors.init_app(app, resources={r"/api/*": {"origins": origins_list}}, supports_credentials=True)
    ma.init_app(app)
    
    # Register API Blueprints
    from backend.routes.auth_routes import auth_bp
    from backend.routes.organization_routes import organization_bp
    from backend.routes.donation_routes import donation_bp
    from backend.routes.request_routes import request_bp
    from backend.routes.pickup_routes import pickup_bp
    from backend.routes.notification_routes import notification_bp
    from backend.routes.safety_routes import safety_bp
    from backend.routes.admin_routes import admin_bp
    from backend.routes.analytics_routes import analytics_bp
    from backend.routes.ai_routes import ai_bp
    from backend.routes.route_routes import route_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(organization_bp)
    app.register_blueprint(donation_bp)
    app.register_blueprint(request_bp)
    app.register_blueprint(pickup_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(safety_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(route_bp)
    
    # Static file route for uploads with path traversal prevention
    ALLOWED_UPLOAD_SUBFOLDERS = {"food", "evidence"}

    @app.route("/api/v1/uploads/<subfolder>/<filename>", methods=["GET"])
    def serve_upload(subfolder, filename):
        if subfolder not in ALLOWED_UPLOAD_SUBFOLDERS:
            return jsonify({"error": "Invalid upload category"}), 400
        safe_dir = os.path.abspath(os.path.join(app.config["UPLOAD_FOLDER"], subfolder))
        upload_root = os.path.abspath(app.config["UPLOAD_FOLDER"])
        if not safe_dir.startswith(upload_root):
            return jsonify({"error": "Path traversal prohibited"}), 403
        return send_from_directory(safe_dir, filename)
        
    # Health check
    @app.route("/api/v1/health", methods=["GET"])
    def health_check():
        db_status = "connected"
        try:
            db.session.execute(db.text("SELECT 1;"))
        except Exception as e:
            db_status = f"unhealthy: {str(e)}"
            
        return jsonify({
            "status": "online",
            "service": "SharePlate Surplus Food Rescue API",
            "version": "1.0.0",
            "database": db_status
        }), 200

    # Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404
        
    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "An internal server error occurred"}), 500

    # JWT Error Handlers
    @jwt.unauthorized_loader
    def missing_token_callback(reason):
        return jsonify({"error": "Authorization token required", "detail": reason}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify({"error": "Invalid authorization token", "detail": reason}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Authorization token expired. Please re-authenticate."}), 401

    # CLI command: Bootstrap admin
    @app.cli.command("create-admin")
    @click.option("--email", prompt="Admin Email", help="Admin account email")
    @click.option("--name", prompt="Full Name", help="Admin full name")
    @click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True, help="Secure admin password")
    def create_admin_cmd(email, name, password):
        """Creates a new platform Administrator securely via CLI."""
        existing = User.query.filter_by(email=email.strip().lower()).first()
        if existing:
            click.echo(f"Error: User with email {email} already exists.")
            return
            
        admin = User(
            email=email.strip().lower(),
            full_name=name.strip(),
            role="ADMIN",
            status="ACTIVE"
        )
        admin.set_password(password)
        db.session.add(admin)
        db.session.commit()
        click.echo(f"Administrator {email} successfully created!")

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "127.0.0.1")
    app.run(host=host, port=port, debug=True)
