# MAJI AI Quotation Assistant

![Maji AI](./app/public/maji-logo-vert.png)

MAJI AI is an advanced, industrial-grade B2B SaaS platform designed to automate and streamline the quotation (devis) process for manufacturing companies (sheet metal, machining, etc.).

By combining a sleek, professional frontend with an AI-powered Python backend, MAJI AI automatically extracts specifications from technical drawings and computes highly accurate manufacturing costs based on industrial benchmarks.

## Architecture

The project is structured into two main components:

- **`/app` (Frontend)**: 
  - A modern React application built with Vite.
  - Handles the interactive quotation wizard, dual-view (Technical vs. Commercial) PDF generation, and historical dashboard.
  - Tech Stack: React 19, Vite, Tailwind-like custom CSS, html2pdf.js, Lucide React.
  
- **`/backend` (Backend)**: 
  - A fast, asynchronous REST API built with FastAPI.
  - Connects to AI Vision and LLM APIs (Groq, OpenRouter, Google Gemini) to extract structured parameters from CAD/PDF blueprints.
  - Contains deterministic costing logic and consistency-validation hooks.
  - Tech Stack: FastAPI, PyMuPDF, Groq, Pytest.

## Getting Started

### 1. Backend Setup

Ensure you have Python 3.10+ installed.

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Environment Variables:**
Create a `.env` file in the `backend/` directory with the following API keys:
```env
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
GEMINI_API_KEY=your_gemini_api_key
```

**Run the Server:**
```bash
uvicorn main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`.

### 2. Frontend Setup

Ensure you have Node.js 18+ installed.

```bash
cd app
npm install
```

**Run the Client:**
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## Testing

The backend calculation and AI extraction schemas are strictly monitored through unit tests to prevent numerical calculation drifting over UI iterations.

To run the test harness:
```bash
cd backend
python -m pytest tests/ -v
```

## GitHub Best Practices Enforced

- **`.gitignore` configured**: Excludes all `node_modules/`, `venv/`, `__pycache__/`, `.env` keys, and sensitive logs from version control.
- **Modularity**: Frontend and Backend are decoupled to allow independent CI/CD deployments.
- **Determinism**: Costing logic is isolated and thoroughly covered by Pytest harnesses.

---
*Developed for industrial quoting performance.*
