# MAJI AI Quotation Assistant (Frontend)

This is the frontend application for **MAJI AI**, an advanced B2B industrial SaaS platform designed to automate and streamline the quotation (devis) process for manufacturing companies (sheet metal, machining, etc.).

## 🚀 Features

- **AI-Powered Extraction**: Upload technical drawings or CAD previews and let Gemini AI automatically extract critical specifications (dimensions, materials, tolerances).
- **Interactive Wizard**: A step-by-step workflow for reviewing extracted data, calculating costs, and validating coherency.
- **Dynamic Costing**: Real-time calculation of material costs, cutting, bending, machining, and labor.
- **Professional Document Generation**: Automatic, client-ready PDF quotation generation (using `html2pdf.js`) with an enterprise-grade, "Stripe-like" clean aesthetic.
- **Quotation History & Dashboard**: Track recent quotes, their status, margins, and total values at a glance.

## 🛠 Tech Stack

- **React 19**
- **Vite** (for blazing fast build tooling)
- **html2pdf.js** (for high-fidelity client-side PDF generation)
- **Lucide React** (for crisp, minimal iconography)

## 📦 Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## 🤝 Backend Integration

This frontend is designed to work seamlessly with the MAJI FastAPI backend. Ensure the backend is running (typically on `http://localhost:8000`) so that the AI extraction, cost calculation, and history saving endpoints (`/api/extract`, `/api/calculate`, `/api/history`) function correctly.

## 📄 PDF Quotation Template

The PDF template is integrated directly into the `PreviewStep.jsx` component. It uses dedicated CSS classes (`.print-devis-wrapper`, `.pd-header`, etc.) defined in `index.css` to ensure exact A4 scaling, precise typography (Inter), and professional formatting when exported.
