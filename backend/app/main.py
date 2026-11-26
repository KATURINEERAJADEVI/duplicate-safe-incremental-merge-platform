from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.core.database import engine, Base, get_db
from backend.app.api.upload import router as upload_router
from backend.app.api.datasets import router as datasets_router
from backend.app.api.analysis import router as analysis_router
from backend.app.api.duplicates import router as duplicates_router
from backend.app.api.lineage import router as lineage_router
from backend.app.api.repairs import router as repairs_router
from backend.app.api.reconciliation import router as reconciliation_router
from backend.app.api.kpis import router as kpis_router
from backend.app.api.audit import router as audit_router
from backend.app.models.repair import QuarantineRecord

# Create tables if not existing
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Duplicate-Safe Incremental Merge Diagnostics and Repair Platform",
    description="Lineage-Aware Duplicate Attribution, Root-Cause Diagnostics, and Deterministic Repair for Data Pipelines.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(upload_router, prefix="/api")
app.include_router(datasets_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(duplicates_router, prefix="/api")
app.include_router(lineage_router, prefix="/api")
app.include_router(repairs_router, prefix="/api")
app.include_router(reconciliation_router, prefix="/api")
app.include_router(kpis_router, prefix="/api")
app.include_router(audit_router, prefix="/api")

# Direct alias for GET /api/quarantine
@app.get("/api/quarantine", tags=["Repairs"])
def get_quarantine_direct(db: Session = Depends(get_db)):
    return db.query(QuarantineRecord).order_by(QuarantineRecord.quarantined_at.desc()).all()

# Health check endpoint
@app.get("/api/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": settings.PROJECT_NAME,
        "database": {
            "type": "MySQL",
            "host": settings.MYSQL_HOST,
            "port": settings.MYSQL_PORT,
            "name": settings.MYSQL_DATABASE,
            "status": db_status
        },
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
