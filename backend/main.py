import os
import json
import datetime
import uuid
import tempfile
import logging
from fastapi import FastAPI, UploadFile, File, Body, HTTPException, Request, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from services.ai_service import extract_specs_from_file, chat_with_ai, get_mock_extraction
from services.cost_service import calculate_costs
from services.validation_service import validate_quotation
from models import CalculateRequest, ValidateRequest, ChatRequest, SaveQuotationRequest, UpdateStatusRequest, APIResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Maji AI Backend", version="1.0.0")

DB_DIR = "data"
os.makedirs(DB_DIR, exist_ok=True)
DB_FILE = os.path.join(DB_DIR, "database.json")

# Startup check
@app.on_event("startup")
async def startup_event():
    # Check for required API keys
    api_keys = [
        os.getenv("GEMINI_API_KEY"),
        os.getenv("GROQ_API_KEY"),
        os.getenv("OPENROUTER_API_KEY")
    ]
    if not any(api_keys):
        logger.warning("No AI API keys configured! System will run in mock mode or fail on extraction.")

def load_db() -> List[dict]:
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                logger.error("Failed to decode database.json. Loading empty list.")
                pass
    # Default mock data
    default_data = [
        {
            "id": "Q-2026-03-01", "reference": "21597494", "designation": "SUPPORT REAR BRAKE",
            "client": "Renault Group", "date": "2026-03-25T13:29:29", "status": "Validé",
            "totalCost": 145.20, "margin": 25
        },
        {
            "id": "Q-2026-03-02", "reference": "98453211", "designation": "CARTER PROTECTION",
            "client": "Alstom", "date": "2026-03-24T10:15:00", "status": "Envoyé",
            "totalCost": 1250.50, "margin": 20
        },
        {
            "id": "Q-2026-03-03", "reference": "77543990", "designation": "PLATINE SUPPORT FIXATION",
            "client": "Safran", "date": "2026-03-26T09:00:00", "status": "Brouillon",
            "totalCost": 320.00, "margin": 30
        }
    ]
    save_db(default_data)
    return default_data

def save_db(data: List[dict]):
    # Atomic write
    fd, temp_path = tempfile.mkstemp(dir=DB_DIR, prefix="db_", suffix=".tmp")
    with os.fdopen(fd, 'w') as f:
        json.dump(data, f, indent=4)
    os.replace(temp_path, DB_FILE)

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
async def extract_pdf(file: UploadFile = File(...), use_mock: bool = Form(False)):
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

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Max 50MB allowed.")

    filename = file.filename
    logger.info(f"Extracting specs from {filename}")
    
    try:
        specs = extract_specs_from_file(content, filename)
        return {"status": "success", "data": specs}
    except Exception as e:
        logger.error(f"Extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/calculate", response_model=APIResponse)
async def calculate_quote(payload: CalculateRequest):
    costs = calculate_costs(payload.specs.model_dump(), payload.parameters)
    return {"status": "success", "data": costs}

@app.post("/api/validate", response_model=APIResponse)
async def validate_quote(payload: ValidateRequest):
    validation_result = validate_quotation(payload.specs.model_dump(), payload.costs)
    return {"status": "success", "data": validation_result}

@app.post("/api/chat", response_model=APIResponse)
async def chat_interaction(payload: ChatRequest):
    response_text = chat_with_ai(payload.message, payload.context, payload.history)
    return {"status": "success", "data": response_text}

@app.get("/api/history", response_model=APIResponse)
async def get_history():
    db_quotations = load_db()
    sorted_history = sorted(db_quotations, key=lambda x: x["date"], reverse=True)
    return {"status": "success", "data": sorted_history}

@app.post("/api/history", response_model=APIResponse)
async def save_quotation(payload: SaveQuotationRequest):
    db_quotations = load_db()
    
    new_quote = payload.model_dump()
    if not new_quote.get("id"):
        new_quote["id"] = f"DEV-{datetime.datetime.now().year}-{str(uuid.uuid4())[:8].upper()}"
    new_quote["date"] = datetime.datetime.now().isoformat()
    
    # Check if exists, update if so
    for i, q in enumerate(db_quotations):
        if q["id"] == new_quote["id"]:
            db_quotations[i] = new_quote
            save_db(db_quotations)
            return {"status": "success", "data": new_quote}
            
    db_quotations.insert(0, new_quote)
    save_db(db_quotations)
    return {"status": "success", "data": new_quote}

@app.put("/api/history/{quote_id}/status", response_model=APIResponse)
async def update_quotation_status(quote_id: str, payload: UpdateStatusRequest):
    db_quotations = load_db()
    for q in db_quotations:
        if q["id"] == quote_id:
            q["status"] = payload.status
            save_db(db_quotations)
            return {"status": "success", "data": q}
    raise HTTPException(status_code=404, detail="Quotation not found")

@app.delete("/api/history/{quote_id}", response_model=APIResponse)
async def delete_quotation(quote_id: str):
    db_quotations = load_db()
    original_len = len(db_quotations)
    db_quotations = [q for q in db_quotations if q["id"] != quote_id]
    
    if len(db_quotations) == original_len:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    save_db(db_quotations)
    return {"status": "success", "data": {"id": quote_id, "deleted": True}}

