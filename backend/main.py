import os
import json
import datetime
import uuid
import tempfile
import logging
from fastapi import FastAPI, UploadFile, File, Body, HTTPException, Request, Form, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any

import firebase_admin
from firebase_admin import credentials, firestore

from services.ai_service import extract_specs_from_file, chat_with_ai, get_mock_extraction
from services.cost_service import calculate_costs
from services.validation_service import validate_quotation
from models import CalculateRequest, ValidateRequest, ChatRequest, SaveQuotationRequest, UpdateStatusRequest, APIResponse
from auth import verify_clerk_token

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Maji AI Backend", version="1.0.0")

# Firebase initialization
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")
db = None
if FIREBASE_CREDENTIALS_PATH and os.path.exists(FIREBASE_CREDENTIALS_PATH):
    try:
        cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        logger.info("Firebase initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
else:
    logger.warning("Firebase credentials not found. Database features will fail.")

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "An unexpected error occurred. Please contact support."}
    )

# Startup check
@app.on_event("startup")
async def startup_event():
    api_keys = [
        os.getenv("GEMINI_API_KEY"),
        os.getenv("GROQ_API_KEY"),
        os.getenv("OPENROUTER_API_KEY")
    ]
    if not any(api_keys):
        logger.warning("No AI API keys configured! System will run in mock mode or fail on extraction.")

# Allow requests from the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:80"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", response_model=APIResponse)
async def health_check():
    return {"status": "success", "data": "ok"}

@app.post("/api/extract", response_model=APIResponse)
async def extract_pdf(file: UploadFile = File(...), use_mock: bool = Form(False), user=Depends(verify_clerk_token)):
    """
    Receives a PDF/Image, sends it to AI.
    """
    if use_mock:
        logger.info("Mock extraction requested by client")
        return {"status": "success", "data": get_mock_extraction()}

    if file.size and file.size > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Max 50MB allowed.")
    
    allowed_types = ["application/pdf", "image/png", "image/jpeg", "image/jpg"]
    if file.content_type not in allowed_types and not file.filename.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=415, detail="Unsupported file type. Use PDF, PNG, or JPG.")

    filename = file.filename
    logger.info(f"Extracting specs from {filename}")
    
    fd, tmp_path = tempfile.mkstemp()
    try:
        with os.fdopen(fd, 'wb') as tmp_file:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                tmp_file.write(chunk)
                
        with open(tmp_path, 'rb') as f:
            content = f.read()
            
        specs = extract_specs_from_file(content, filename)
        return {"status": "success", "data": specs}
    except Exception as e:
        logger.error(f"Extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.post("/api/calculate", response_model=APIResponse)
async def calculate_quote(payload: CalculateRequest, user=Depends(verify_clerk_token)):
    costs = calculate_costs(payload.specs.model_dump(), payload.parameters)
    return {"status": "success", "data": costs}

@app.post("/api/validate", response_model=APIResponse)
async def validate_quote(payload: ValidateRequest, user=Depends(verify_clerk_token)):
    validation_result = validate_quotation(payload.specs.model_dump(), payload.costs)
    return {"status": "success", "data": validation_result}

@app.post("/api/chat", response_model=APIResponse)
async def chat_interaction(payload: ChatRequest, user=Depends(verify_clerk_token)):
    response_text = chat_with_ai(payload.message, payload.context, payload.history)
    return {"status": "success", "data": response_text}

@app.get("/api/history", response_model=APIResponse)
async def get_history(user=Depends(verify_clerk_token)):
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    user_id = user.get("sub")
    
    try:
        docs = db.collection("quotations").where("user_id", "==", user_id).order_by("date", direction=firestore.Query.DESCENDING).limit(50).stream()
        data = [doc.to_dict() for doc in docs]
        return {"status": "success", "data": data}
    except Exception as e:
        # If an index is missing, Firestore usually raises an exception with a URL to create it.
        logger.error(f"Error fetching history: {e}")
        # Fallback to no ordering if index isn't created yet
        docs = db.collection("quotations").where("user_id", "==", user_id).limit(50).stream()
        data = sorted([doc.to_dict() for doc in docs], key=lambda x: x.get("date", ""), reverse=True)
        return {"status": "success", "data": data}

@app.post("/api/history", response_model=APIResponse)
async def save_quotation(payload: SaveQuotationRequest, user=Depends(verify_clerk_token)):
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    new_quote = payload.model_dump()
    if not new_quote.get("id"):
        new_quote["id"] = f"DEV-{datetime.datetime.now().year}-{str(uuid.uuid4())[:8].upper()}"
    new_quote["date"] = datetime.datetime.now().isoformat()
    new_quote["user_id"] = user.get("sub")
    
    db.collection("quotations").document(new_quote["id"]).set(new_quote)
    return {"status": "success", "data": new_quote}

@app.put("/api/history/{quote_id}/status", response_model=APIResponse)
async def update_quotation_status(quote_id: str, payload: UpdateStatusRequest, user=Depends(verify_clerk_token)):
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    user_id = user.get("sub")
    doc_ref = db.collection("quotations").document(quote_id)
    doc = doc_ref.get()
    
    if not doc.exists or doc.to_dict().get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Quotation not found or unauthorized")
        
    doc_ref.update({"status": payload.status})
    updated_doc = doc_ref.get().to_dict()
    
    return {"status": "success", "data": updated_doc}

@app.delete("/api/history/{quote_id}", response_model=APIResponse)
async def delete_quotation(quote_id: str, user=Depends(verify_clerk_token)):
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    user_id = user.get("sub")
    doc_ref = db.collection("quotations").document(quote_id)
    doc = doc_ref.get()
    
    if not doc.exists or doc.to_dict().get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Quotation not found or unauthorized")
        
    doc_ref.delete()
    return {"status": "success", "data": {"id": quote_id, "deleted": True}}

@app.get("/api/config", response_model=APIResponse)
async def get_global_config(user=Depends(verify_clerk_token)):
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
    doc = db.collection("system").document("global_config").get()
    if doc.exists:
        return {"status": "success", "data": doc.to_dict()}
    return {"status": "success", "data": {}}

@app.post("/api/config", response_model=APIResponse)
async def save_global_config(payload: Dict[str, Any] = Body(...), user=Depends(verify_clerk_token)):
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # In a real app, check for admin role here
    # role = user.get("metadata", {}).get("role")
    # if role != "admin": raise HTTPException(status_code=403, detail="Forbidden")

    db.collection("system").document("global_config").set(payload)
    return {"status": "success", "data": payload}

@app.post("/api/webhook/erp", response_model=APIResponse)
async def trigger_erp_webhook(payload: Dict[str, Any] = Body(...), user=Depends(verify_clerk_token)):
    # Mock ERP Webhook
    logger.info(f"Triggering ERP Webhook for quote {payload.get('id')}...")
    # Simulate network call to Sylob / Clipper
    import asyncio
    await asyncio.sleep(1)
    logger.info("ERP Sync Successful")
    return {"status": "success", "message": "Synchronisation ERP (Sylob/Clipper) réussie."}

