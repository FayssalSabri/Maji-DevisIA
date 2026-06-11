import os
import json
import fitz  # PyMuPDF
import base64
import requests
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

# Configure Groq for all AI tasks
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_VISION_MODEL = os.getenv("OPENROUTER_VISION_MODEL", "meta-llama/llama-3.2-11b-vision-instruct")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """
    Extracts raw text from a PDF or image file using PyMuPDF.
    """
    ext = os.path.splitext(filename)[1].lower()

    if ext == ".pdf":
        doc = fitz.open("pdf", file_content)
        full_text = ""
        for page in doc:
            full_text += page.get_text() + "\n"
        return full_text.strip()
    else:
        doc = fitz.open(stream=file_content, filetype=ext.replace(".", ""))
        full_text = ""
        for page in doc:
            full_text += page.get_text() + "\n"
        return full_text.strip()

def extract_image_base64_from_file(file_content: bytes, filename: str) -> str:
    """
    Extracts the first page as a base64 encoded JPEG for vision models.
    """
    ext = os.path.splitext(filename)[1].lower()
    if ext == ".pdf":
        doc = fitz.open("pdf", file_content)
    else:
        doc = fitz.open(stream=file_content, filetype=ext.replace(".", ""))
    
    # Get first page
    page = doc[0]
    # Render page to an image (matrix scales it down slightly if it's too large)
    zoom = 1.5
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    
    # Convert to base64
    img_bytes = pix.tobytes("jpeg")
    base64_img = base64.b64encode(img_bytes).decode("utf-8")
    return base64_img


def extract_specs_from_file(file_content: bytes, filename: str) -> dict:
    if not groq_client:
        print("No GROQ_API_KEY found. Falling back to mock extraction.")
        return get_mock_extraction()

    prompt = f"""
You are an expert industrial estimator analyzing a technical manufacturing drawing.
Extract all manufacturing specifications and return ONLY valid JSON that strictly matches the following schema.
Do not include markdown blocks or any other text.

Schema:
{{
  "identification": {{"reference": "string", "designation": "string", "client": "string"}},
  "material": {{"type": "string", "nuance": "string", "thickness": float, "treatment": "string"}},
  "dimensions": {{"length": float, "width": float, "height": float, "developedSurface": float, "cuttingLength": float, "volume": float, "mass": float}},
  "holes": [{{"shape": "string", "diameter": float, "quantity": int}}],
  "bends": [{{"angle": float, "radius": float, "length": float, "quantity": int}}],
  "tolerances": {{"iso": "string", "notes": "string"}}
}}

Rules:
- For missing numeric values, use 0.0 or 0
- For missing string values, use "Non renseigné"
- Extract the client name from any company branding (e.g. "RENAULT TRUCKS" → client)
- Extract the document number as the reference
- Extract the designation/title of the part
- Parse all hole diameters, bend angles/radii, and dimensions you can find
- Parse tolerance standards (ISO, etc.)
- For volume and mass, estimate from dimensions if not explicitly stated
"""

    try:
        # Step 1: Local text extraction
        raw_text = extract_text_from_file(file_content, filename)
        print(f"Extracted {len(raw_text)} characters from {filename}")

        if not raw_text or len(raw_text.strip()) < 10:
            print("Warning: Very little text extracted. The file may be a scanned image.")
            
            content = None
            base64_image = extract_image_base64_from_file(file_content, filename)

            # 1. Primary Strategy: Gemini Vision (Cloud, Zero local CPU)
            if not content and GEMINI_API_KEY:
                print("Using Google Gemini Vision extraction...")
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
                headers = {"Content-Type": "application/json"}
                payload = {
                    "contents": [{
                        "parts": [
                            {"text": prompt + "\nAnalyze this technical drawing and return ONLY the valid JSON structure:"},
                            {"inline_data": {"mime_type": "image/jpeg", "data": base64_image}}
                        ]
                    }],
                    "generationConfig": {
                        "temperature": 0.1
                    }
                }
                
                req_res = requests.post(url, headers=headers, json=payload)
                if not req_res.ok:
                    print(f"Gemini API Error: {req_res.status_code} - {req_res.text}")
                else:
                    try:
                        content = req_res.json()["candidates"][0]["content"]["parts"][0]["text"]
                        print("Gemini Vision extraction successful!")
                    except (KeyError, IndexError) as e:
                        print(f"Failed to parse Gemini response: {e}")
                        content = None

            # 2. Secondary Strategy: OpenRouter
            if not content and OPENROUTER_API_KEY:
                print("Using OpenRouter Vision extraction fallback...")
                
                headers = {
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": OPENROUTER_VISION_MODEL,
                    "temperature": 0.1,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt + "\nAnalyze this technical drawing and return the JSON:"},
                                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                            ]
                        }
                    ]
                }
                
                req_res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
                if not req_res.ok:
                    print(f"OpenRouter Error: {req_res.status_code} - {req_res.text}")
                else:
                    content = req_res.json()["choices"][0]["message"]["content"]
            
            if not content:
                print("No API Key found or all vision models failed. Falling back to mock extraction.")
                return get_mock_extraction()
        else:
            # Send extracted text to Groq for structured extraction
            text_prompt = prompt + f"\n--- RAW TEXT FROM DRAWING ---\n{raw_text}\n--- END OF TEXT ---\n"
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are an expert manufacturing engineer. Return only valid JSON."},
                    {"role": "user", "content": text_prompt}
                ],
                temperature=0.1,
                max_tokens=2048
            )
            content = response.choices[0].message.content

        # Clean up potential markdown formatting
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]

        result_dict = json.loads(content.strip())

        # Add confidence scores
        result_dict["confidences"] = {
            "reference": "high",
            "designation": "high",
            "material": "medium",
            "thickness": "high",
            "dimensions": "high",
            "holes": "high",
            "bends": "medium"
        }

        print("Groq extraction successful!")
        return result_dict

    except Exception as e:
        print(f"Error during Groq extraction: {e}")
        print("Falling back to mock extraction.")
        return get_mock_extraction()

def get_mock_extraction() -> dict:
    return {
        "identification": {
            "reference": "21597494",
            "designation": "SUPPORT REAR BRAKE",
            "client": "Renault Group"
        },
        "material": {
            "type": "Steel",
            "nuance": "S235JR",
            "thickness": 2.0,
            "treatment": "None"
        },
        "dimensions": {
            "length": 60.0,
            "width": 60.0,
            "height": 2.0,
            "developedSurface": 0.0004,
            "cuttingLength": 40.0,
            "volume": 8667.4,
            "mass": 68.0
        },
        "holes": [
            {"shape": "rond", "diameter": 4.0, "quantity": 2},
            {"shape": "rond", "diameter": 8.0, "quantity": 2}
        ],
        "bends": [
            {"angle": 45.0, "radius": 2.0, "length": 60.0, "quantity": 2}
        ],
        "tolerances": {
            "iso": "ISO 2768 -m",
            "notes": "BENDING RADIUS: 2mm, UNDIMENSIONED RADIUS: 2mm, NO PAINT ON THREADS"
        },
        "confidences": {
            "reference": "high",
            "designation": "high",
            "material": "medium",
            "thickness": "high",
            "dimensions": "high",
            "holes": "high",
            "bends": "medium"
        }
    }

def chat_with_ai(message: str, context: dict, history: list) -> str:
    if not groq_client:
        return "L'assistant conversationnel nécessite une clé API Groq valide."

    try:
        system_instruction = f"""
        Tu es l'assistant IA "MAJI AI" spécialisé dans le chiffrage industriel de tôlerie. 
        Réponds de manière professionnelle, courte et précise, en français.
        Voici le contexte du devis actuel:
        Spécifications extraites: {json.dumps(context.get('specs', {}), ensure_ascii=False)}
        Coûts calculés: {json.dumps(context.get('costs', {}), ensure_ascii=False)}
        Résultat de la validation (problèmes): {json.dumps(context.get('validation', {}), ensure_ascii=False)}
        """

        messages = [{"role": "system", "content": system_instruction}]

        for msg in history:
            role = msg.get("role", "user")
            if role == "model":
                role = "assistant"
            messages.append({"role": role, "content": msg.get("content", "")})

        messages.append({"role": "user", "content": message})

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1024
        )

        return response.choices[0].message.content
    except Exception as e:
        print(f"Chat Error: {e}")
        return "Une erreur s'est produite lors de la communication avec l'assistant IA."
