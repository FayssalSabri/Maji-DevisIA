from fastapi import FastAPI, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List

from services.ai_service import extract_specs_from_file, chat_with_ai
from services.cost_service import calculate_costs
from services.validation_service import validate_quotation
import datetime

app = FastAPI(title="Maji AI Backend", version="1.0.0")

# Simple in-memory database for demo purposes
db_quotations = [
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

# Allow requests from the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/extract")
async def extract_pdf(file: UploadFile = File(...)):
    """
    Receives a PDF/Image, sends it to Gemini (if API key is present),
    and returns the structured JSON specs.
    """
    content = await file.read()
    filename = file.filename
    
    # Process extraction
    specs = extract_specs_from_file(content, filename)
    
    return {"status": "success", "data": specs}

@app.post("/api/calculate")
async def calculate_quote(payload: Dict[str, Any] = Body(...)):
    """
    Receives specs and parameters, returns cost breakdown.
    """
    specs = payload.get("specs", {})
    params = payload.get("parameters", {})
    
    costs = calculate_costs(specs, params)
    
    return {"status": "success", "data": costs}

@app.post("/api/validate")
async def validate_quote(payload: Dict[str, Any] = Body(...)):
    """
    Receives specs and costs, returns AI validation score and warnings.
    """
    specs = payload.get("specs", {})
    costs = payload.get("costs", {})
    
    validation_result = validate_quotation(specs, costs)
    
    return {"status": "success", "data": validation_result}

@app.post("/api/chat")
async def chat_interaction(payload: Dict[str, Any] = Body(...)):
    """
    Receives user message and quotation context, returns AI response.
    """
    message = payload.get("message", "")
    context = payload.get("context", {})
    history = payload.get("history", [])
    
    response_text = chat_with_ai(message, context, history)
    
    return {"status": "success", "data": response_text}

@app.get("/api/history")
async def get_history():
    # Sort by date descending
    sorted_history = sorted(db_quotations, key=lambda x: x["date"], reverse=True)
    return {"status": "success", "data": sorted_history}

@app.post("/api/history")
async def save_quotation(payload: Dict[str, Any] = Body(...)):
    new_quote = {
        "id": payload.get("id"),
        "reference": payload.get("reference", "N/A"),
        "designation": payload.get("designation", "Sans nom"),
        "client": payload.get("client", "N/A"),
        "date": datetime.datetime.now().isoformat(),
        "status": payload.get("status", "Validé"),
        "totalCost": payload.get("totalCost", 0),
        "margin": payload.get("margin", 25)
    }
    db_quotations.insert(0, new_quote)
    return {"status": "success", "data": new_quote}
