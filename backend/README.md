# MAJI AI Backend

This is the FastAPI-based backend for the MAJI AI Quotation Assistant. It exposes RESTful APIs to process technical blueprints, run industrial cost logic, and validate quoting parameters.

## API Endpoints

- `POST /api/extract`: Receives an image or PDF file. Uses Groq (or fallback OpenRouter/Gemini vision models) to extract structural engineering parameters (dimensions, materials, tolerances).
- `POST /api/calculate`: Consumes the extracted specifications alongside industrial baseline configurations to output an itemized pricing breakdown.
- `POST /api/validate`: Cross-references specifications and costs for anomalies, outputting a coherence score and warnings.
- `POST /api/chat`: Provides an interactive assistant aware of the current quotation state.
- `GET/POST /api/history`: Manages persistent quotation history.

## Setup

1. Create a virtual environment: `python -m venv venv`
2. Activate it: `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
3. Install dependencies: `pip install -r requirements.txt`
4. Set your API Keys in a `.env` file (see root README).

## Running the Server
```bash
uvicorn main:app --reload --port 8000
```

## Testing
Unit tests ensure that numerical calculations do not drift over time and fallback logic triggers properly without crashing the UI.

```bash
python -m pytest tests/ -v
```
