import os
import shutil
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(prefix="/documents", tags=["documents"])

# Root directory to store documents inside the workspace
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "documents")

# Ensure target folder exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

VALID_DOC_TYPES = {"POLICY", "OFFER", "NDA", "GUIDELINE", "GENERAL"}

@router.post("/upload", response_model=schemas.DocumentResponse)
def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    db: Session = Depends(get_db)
):
    """Upload a company document and store metadata in SQLite."""
    doc_type_upper = doc_type.upper()
    if doc_type_upper not in VALID_DOC_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document type. Must be one of: {list(VALID_DOC_TYPES)}"
        )

    # Generate a unique path to avoid filename collisions
    file_id = uuid.uuid4().hex
    original_filename = file.filename or "unnamed_document"
    # Keep the extension
    _, ext = os.path.splitext(original_filename)
    unique_filename = f"{file_id}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Write file to disk
    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file to disk: {str(e)}"
        )

    # Calculate file size
    file_size = os.path.getsize(dest_path)

    # Save metadata in database
    new_doc = models.Document(
        filename=original_filename,
        file_path=dest_path,
        doc_type=doc_type_upper,
        uploaded_at=datetime.utcnow().isoformat(),
        file_size=file_size
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return new_doc


@router.get("/", response_model=list[schemas.DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    """Fetch metadata for all uploaded documents."""
    return db.query(models.Document).all()


@router.get("/{document_id}/download")
def download_document(document_id: int, db: Session = Depends(get_db)):
    """Download a company document file."""
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document record not found"
        )
    
    if not os.path.exists(doc.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file not found on server"
        )

    return FileResponse(
        path=doc.file_path,
        filename=doc.filename,
        media_type="application/octet-stream"
    )


@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    """Delete a document record and clean up its file on disk."""
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Remove physical file from disk
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            # Continue database deletion even if disk file removal fails
            print(f"Warning: could not delete physical file at {doc.file_path}: {e}")

    # Remove database entry
    db.delete(doc)
    db.commit()

    return {"message": "Document deleted successfully"}
