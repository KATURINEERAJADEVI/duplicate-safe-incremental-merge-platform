from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.schemas.analysis import AnalysisStartRequest, AnalysisSummaryResponse
from backend.app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/analysis", tags=["Analysis"])

# In-memory storage of last run analysis summary for quick dashboard access
_last_analysis_result = {}

@router.post("/start", response_model=AnalysisSummaryResponse)
def start_analysis(
    req: AnalysisStartRequest, 
    db: Session = Depends(get_db)
):
    """
    Main Analysis Endpoint:
    Triggers full 8-step duplicate-safe merge analysis on Dataset A + Dataset B
    using the user-confirmed business key.
    """
    if not req.business_key_columns:
        raise HTTPException(status_code=400, detail="At least one business key column must be selected.")

    result = AnalysisService.run_full_pipeline(
        dataset_a_id=req.dataset_a_id,
        dataset_b_id=req.dataset_b_id,
        key_columns=req.business_key_columns,
        source_priorities=req.source_priority_map,
        db=db
    )
    _last_analysis_result[result["run_id"]] = result
    _last_analysis_result["latest"] = result
    return result

@router.get("/latest", response_model=AnalysisSummaryResponse)
def get_latest_analysis():
    """
    Returns the latest completed analysis summary.
    """
    if "latest" not in _last_analysis_result:
        raise HTTPException(status_code=404, detail="No analysis has been run yet.")
    return _last_analysis_result["latest"]

@router.get("/{id}", response_model=AnalysisSummaryResponse)
def get_analysis_by_id(id: str):
    """
    Returns a specific analysis summary by run ID.
    """
    if id not in _last_analysis_result:
        raise HTTPException(status_code=404, detail="Analysis run not found.")
    return _last_analysis_result[id]
