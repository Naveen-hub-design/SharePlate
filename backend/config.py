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

import urllib.parse

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "shareplate-production-grade-default-key-391823")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "shareplate-jwt-production-secret-981273")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "120")))
    
    # Database config
    DB_TYPE = os.getenv("DB_TYPE", "sqlite").strip().lower()
    USE_SQLITE = DB_TYPE == "sqlite" or os.getenv("USE_SQLITE", "").strip().lower() in ("1", "true", "yes") or os.getenv("DATABASE_URL", "").startswith("sqlite")
    
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "3306")
    DB_NAME = os.getenv("DB_NAME", "shareplate_db")
    encoded_password = urllib.parse.quote_plus(DB_PASSWORD)

    if USE_SQLITE:
        SQLITE_PATH = os.path.abspath(os.path.join(root_dir, "shareplate.db")).replace("\\", "/")
        env_db_url = os.getenv("DATABASE_URL", "").strip()
        path_part = env_db_url.replace("sqlite:///", "").replace("sqlite://", "")
        if env_db_url.startswith("sqlite") and path_part and os.path.isabs(path_part):
            SQLALCHEMY_DATABASE_URI = env_db_url
        else:
            SQLALCHEMY_DATABASE_URI = f"sqlite:///{SQLITE_PATH}"
        SQLALCHEMY_ENGINE_OPTIONS = {
            "connect_args": {"check_same_thread": False}
        }
    else:
        SQLALCHEMY_DATABASE_URI = os.getenv(
            "DATABASE_URL",
            f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
        )
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_pre_ping": True,
            "pool_recycle": 3600,
            "pool_size": 10,
            "max_overflow": 20
        }
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
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
    if Config.USE_SQLITE:
        SQLITE_TEST_PATH = os.path.abspath(os.path.join(root_dir, "shareplate_test.db")).replace("\\", "/")
        env_test_url = os.getenv("TEST_DATABASE_URL", "").strip()
        test_path_part = env_test_url.replace("sqlite:///", "").replace("sqlite://", "")
        if env_test_url.startswith("sqlite") and test_path_part and os.path.isabs(test_path_part):
            SQLALCHEMY_DATABASE_URI = env_test_url
        else:
            SQLALCHEMY_DATABASE_URI = f"sqlite:///{SQLITE_TEST_PATH}"
        SQLALCHEMY_ENGINE_OPTIONS = {
            "connect_args": {"check_same_thread": False}
        }
    else:
        DB_NAME = os.getenv("TEST_DB_NAME", "shareplate_test_db")
        SQLALCHEMY_DATABASE_URI = os.getenv(
            "TEST_DATABASE_URL",
            f"mysql+pymysql://{Config.DB_USER}:{Config.encoded_password}@{Config.DB_HOST}:{Config.DB_PORT}/{DB_NAME}?charset=utf8mb4"
        )
        SQLALCHEMY_ENGINE_OPTIONS = {
            "isolation_level": "READ COMMITTED",
            "pool_pre_ping": True,
            "pool_recycle": 3600
        }
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
