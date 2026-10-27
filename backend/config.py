import os
from datetime import timedelta
from dotenv import load_dotenv

# Load root .env or backend .env
basedir = os.path.abspath(os.path.dirname(__file__))
root_dir = os.path.abspath(os.path.join(basedir, ".."))

# Prefer root .env if exists, otherwise backend .env
if os.path.exists(os.path.join(root_dir, ".env")):
    load_dotenv(os.path.join(root_dir, ".env"))
else:
    load_dotenv(os.path.join(basedir, ".env"))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "shareplate-production-grade-default-key-391823")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "shareplate-jwt-production-secret-981273")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "120")))
    
    # Database config
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "naveenke1234@")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "3306")
    DB_NAME = os.getenv("DB_NAME", "shareplate_db")
    
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "pool_size": 10,
        "max_overflow": 20
    }
    
    # File Storage
    UPLOAD_FOLDER = os.path.join(basedir, os.getenv("UPLOAD_FOLDER", "uploads"))
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", str(10 * 1024 * 1024))) # 10MB
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
    
    # Food safety defaults per FSSAI regulations
    FSSAI_COOKED_MAX_HOURS_AMBIENT = float(os.getenv("FSSAI_COOKED_MAX_HOURS_AMBIENT", "4.0"))
    FSSAI_HOT_HOLD_MIN_TEMP_C = float(os.getenv("FSSAI_HOT_HOLD_MIN_TEMP_C", "60.0"))
    FSSAI_COLD_HOLD_MAX_TEMP_C = float(os.getenv("FSSAI_COLD_HOLD_MAX_TEMP_C", "5.0"))
    
    # AI settings
    AI_PROVIDER = os.getenv("AI_PROVIDER", "fallback")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

class TestConfig(Config):
    TESTING = True
    DB_NAME = os.getenv("TEST_DB_NAME", "shareplate_test_db")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "TEST_DATABASE_URL",
        f"mysql+pymysql://{Config.DB_USER}:{Config.DB_PASSWORD}@{Config.DB_HOST}:{Config.DB_PORT}/{DB_NAME}?charset=utf8mb4"
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
