from fastapi import APIRouter, Depends
from fastapi.responses import Response
from core.security import get_current_user
from services.report_service import generate_report_pdf

router = APIRouter(prefix="/report", tags=["report"])


@router.get("/pdf")
def download_report(user=Depends(get_current_user)):
    pdf_bytes = generate_report_pdf()
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=business_report.pdf"},
    )
