import os
from pathlib import Path
from urllib.parse import quote_plus
from pydantic_settings import BaseSettings

# Base directory for the backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BASE_DIR.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Duplicate-Safe Incremental Merge Platform"
    API_V1_STR: str = "/api"
    
    # MySQL Database Settings
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "duplicate_safe_merge")
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"mysql+pymysql://{MYSQL_USER}:{quote_plus(MYSQL_PASSWORD)}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
    )
    
    # Data Directories
    DATA_DIR: Path = BASE_DIR / "app" / "data"
    UPLOAD_DIR: Path = DATA_DIR / "uploads"
    PROCESSED_DIR: Path = DATA_DIR / "processed"
    QUARANTINE_DIR: Path = DATA_DIR / "quarantine"
    REPAIRED_DIR: Path = DATA_DIR / "repaired"
    
    # Source Priorities for Attribution Engine
    SOURCE_PRIORITIES: dict = {
        "CORE_BANKING": 10,
        "ONLINE_PORTAL": 8,
        "BRANCH_TELLER": 7,
        "MOBILE_APP": 6,
        "ATM_NETWORK": 4,
        "POS_TERMINAL": 3,
        "LEGACY_SYSTEM": 1
    }

    class Config:
        env_file = ROOT_DIR / ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
for path in [settings.DATA_DIR, settings.UPLOAD_DIR, settings.PROCESSED_DIR, settings.QUARANTINE_DIR, settings.REPAIRED_DIR]:
    path.mkdir(parents=True, exist_ok=True)
