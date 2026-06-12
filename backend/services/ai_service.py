import os
import json
import fitz  # PyMuPDF
import base64
import requests
import logging
import time
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

logger = logging.getLogger(__name__)

# Configure AI clients
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

def extract_images_base64_from_file(file_content: bytes, filename: str) -> list:
    """
    Extracts pages as base64 encoded JPEGs for vision models.
    Supports multiple pages.
    """
    ext = os.path.splitext(filename)[1].lower()
    if ext == ".pdf":
        doc = fitz.open("pdf", file_content)
    else:
        doc = fitz.open(stream=file_content, filetype=ext.replace(".", ""))
    
    base64_images = []
    zoom = 1.5
    mat = fitz.Matrix(zoom, zoom)
    
    # Process up to 3 pages to avoid payload limits
    for i in range(min(len(doc), 3)):
        page = doc[i]
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_bytes = pix.tobytes("jpeg")
        base64_images.append(base64.b64encode(img_bytes).decode("utf-8"))
        
    return base64_images

def clean_json_response(content: str) -> str:
    content = content.strip()
    # Try to extract content between curly braces if markdown fences fail
    start_idx = content.find('{')
    end_idx = content.rfind('}')
    if start_idx != -1 and end_idx != -1:
        content = content[start_idx:end_idx+1]
    return content

def extract_specs_from_file(file_content: bytes, filename: str) -> dict:
    # If no API keys at all, return mock
    if not any([GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY]):
        logger.warning("No AI API keys configured. Returning mock extraction.")
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
- Extract the client name from any company branding
- Extract the document number as the reference
- Extract the designation/title of the part
- Parse all hole diameters, bend angles/radii, and dimensions you can find
- Parse tolerance standards (ISO, etc.)
- For volume and mass, estimate from dimensions if not explicitly stated
"""

    max_retries = 2
    for attempt in range(max_retries):
        try:
            raw_text = extract_text_from_file(file_content, filename)
            logger.info(f"Extracted {len(raw_text)} characters from {filename}")

            content = None

            if not raw_text or len(raw_text.strip()) < 10:
                logger.warning("Very little text extracted. Using Vision model.")
                base64_images = extract_images_base64_from_file(file_content, filename)

                if GEMINI_API_KEY:
                    logger.info("Using Google Gemini Vision extraction...")
                    # The Gemini REST API requires the key in the URL, which is standard for their beta API
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
                    headers = {"Content-Type": "application/json"}
                    
                    parts = [{"text": prompt + "\nAnalyze this technical drawing and return ONLY the valid JSON structure:"}]
                    for b64 in base64_images:
                        parts.append({"inline_data": {"mime_type": "image/jpeg", "data": b64}})
                        
                    payload = {"contents": [{"parts": parts}], "generationConfig": {"temperature": 0.1}}
                    
                    req_res = requests.post(url, headers=headers, json=payload, timeout=60)
                    if not req_res.ok:
                        logger.error(f"Gemini API Error: {req_res.status_code} - {req_res.text}")
                    else:
                        try:
                            content = req_res.json()["candidates"][0]["content"]["parts"][0]["text"]
                            logger.info("Gemini Vision extraction successful!")
                        except (KeyError, IndexError) as e:
                            logger.error(f"Failed to parse Gemini response: {e}")

                if not content and OPENROUTER_API_KEY:
                    logger.info("Using OpenRouter Vision extraction fallback...")
                    headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"}
                    
                    content_parts = [{"type": "text", "text": prompt + "\nAnalyze this technical drawing and return the JSON:"}]
                    for b64 in base64_images:
                         content_parts.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}})
                         
                    payload = {
                        "model": OPENROUTER_VISION_MODEL,
                        "temperature": 0.1,
                        "messages": [{"role": "user", "content": content_parts}]
                    }
                    
                    req_res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=60)
                    if not req_res.ok:
                        logger.error(f"OpenRouter Error: {req_res.status_code} - {req_res.text}")
                    else:
                        try:
                            content = req_res.json()["choices"][0]["message"]["content"]
                            logger.info("OpenRouter extraction successful!")
                        except (KeyError, IndexError) as e:
                            logger.error(f"Failed to parse OpenRouter response: {e}")
                
                if not content:
                    raise Exception("All vision models failed to return content")

            else:
                if not groq_client:
                    raise Exception("Text extracted but GROQ_API_KEY is missing for processing.")
                
                logger.info("Sending extracted text to Groq for structured extraction")
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

            # Clean and parse JSON
            content = clean_json_response(content)
            result_dict = json.loads(content)

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

            logger.info("Extraction successful!")
            return result_dict

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error on attempt {attempt+1}: {e}")
            if attempt == max_retries - 1:
                raise Exception(f"AI returned invalid JSON: {content}")
        except Exception as e:
            logger.error(f"Error during extraction on attempt {attempt+1}: {e}")
            if attempt == max_retries - 1:
                raise Exception(f"Failed to extract specifications: {str(e)}")
            time.sleep(2)  # Backoff before retry

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
            "treatment": "Non renseigné"
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
            "notes": "BENDING RADIUS: 2mm, UNDIMENSIONED RADIUS: 2mm"
        },
        "confidences": {
            "reference": "high",
            "designation": "high",
            "material": "medium",
            "thickness": "high",
            "dimensions": "high",
            "holes": "high",
            "bends": "medium"
        },
        "is_mock": True
    }

def chat_with_ai(message: str, context: dict, history: list) -> str:
    if not groq_client:
        return "L'assistant conversationnel nécessite une clé API Groq valide."

    try:
        system_instruction = f"""
        Tu es l'assistant IA "MAJI AI" spécialisé dans le chiffrage industriel de tôlerie. 
        Réponds de manière professionnelle, courte et précise, en français.
        Voici le contexte du devis actuel:
        Spécifications extraites: {json.dumps(context.get('specs', dict()), ensure_ascii=False)}
        Coûts calculés: {json.dumps(context.get('costs', dict()), ensure_ascii=False)}
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
        logger.error(f"Chat Error: {e}")
        return "Une erreur s'est produite lors de la communication avec l'assistant IA."
