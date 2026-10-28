import sys
import argparse
from backend.app import create_app
from backend.extensions import db
from backend.models.user import User

def bootstrap_admin(email: str, name: str, password: str):
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(email=email.strip().lower()).first()
        if user:
            print(f"User {email} already exists. Updating role to ADMIN...")
            user.role = "ADMIN"
            user.status = "ACTIVE"
            user.set_password(password)
        else:
            print(f"Creating new Administrator {email}...")
            user = User(
                email=email.strip().lower(),
                full_name=name.strip(),
                role="ADMIN",
                status="ACTIVE"
            )
            user.set_password(password)
            db.session.add(user)
            
        db.session.commit()
        print(f"Admin account '{email}' is ready.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bootstrap SharePlate Platform Administrator")
    parser.add_argument("--email", default="admin@shareplate.org", help="Administrator email")
    parser.add_argument("--name", default="Platform Admin", help="Full name")
    parser.add_argument("--password", default="AdminSecure2026!", help="Admin password")
    args = parser.parse_args()
    
    bootstrap_admin(args.email, args.name, args.password)
