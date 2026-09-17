import os
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from pypdf import PdfReader
import docx
import io

app = Flask(__name__)
# Permitimos peticiones cruzadas usando la variable de entorno ALLOWED_ORIGIN configurada en Vercel
allowed_origin = os.environ.get("ALLOWED_ORIGIN", "*")
CORS(app, resources={r"/api/*": {"origins": allowed_origin}})

# Clase Principal con Programación Orientada a Objetos (POO)
class MultimodalTranslatorService:
    def __init__(self):
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

    def translate_text(self, text, direction="es-en"):
        target_lang = "English" if direction == "es-en" else "Spanish"
        source_lang = "Spanish" if direction == "es-en" else "English"
        
        prompt = f"Translate the following text accurately from {source_lang} to {target_lang}. Keep the original meaning and natural style:\n\n{text}"
        
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional bi-lingual translator expert in Spanish and English."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        return response.choices[0].message.content

    def translate_image(self, image_base64, direction="es-en"):
        target_lang = "English" if direction == "es-en" else "Spanish"
        
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"Extract all visible text from this image and translate it accurately into {target_lang}. If there is no legible text or poor quality, report it explicitly stating that no readable text was found."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                    ]
                }
            ],
            max_tokens=500
        )
        return response.choices[0].message.content

    def translate_audio(self, audio_file_storage, direction="es-en"):
        # Guardamos temporalmente el archivo de audio para pasarlo a Whisper
        temp_path = "/tmp/temp_audio.mp3"
        audio_file_storage.save(temp_path)
        
        with open(temp_path, "rb") as audio_file:
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        
        original_text = transcript.text
        if not original_text.strip():
            return {"original": "", "translation": "No speech detected or audio quality is too low."}
            
        translated_text = self.translate_text(original_text, direction)
        return {"original": original_text, "translation": translated_text}

# Instanciamos el servicio
translator_service = MultimodalTranslatorService()

@app.route("/api/translate-text", methods=["POST"])
def api_translate_text():
    try:
        data = request.json
        text = data.get("text", "")
        direction = data.get("direction", "es-en")
        if not text:
            return jsonify({"error": "No text provided"}), 400
            
        translation = translator_service.translate_text(text, direction)
        return jsonify({"success": True, "translation": translation})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/translate-chat", methods=["POST"])
def api_translate_chat():
    try:
        data = request.json
        message = data.get("message", "")
        direction = data.get("direction", "es-en")
        if not message:
            return jsonify({"error": "No message provided"}), 400
            
        translation = translator_service.translate_text(message, direction)
        return jsonify({"success": True, "original": message, "translation": translation})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/translate-image", methods=["POST"])
def api_translate_image():
    try:
        data = request.json
        image_b64 = data.get("image", "")
        direction = data.get("direction", "es-en")
        if not image_b64:
            return jsonify({"error": "No image provided"}), 400
            
        translation = translator_service.translate_image(image_b64, direction)
        return jsonify({"success": True, "translation": translation})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/translate-audio", methods=["POST"])
def api_translate_audio():
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        audio_file = request.files["audio"]
        direction = request.form.get("direction", "es-en")
        
        result = translator_service.translate_audio(audio_file, direction)
        return jsonify({"success": True, "original": result["original"], "translation": result["translation"]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/translate-doc", methods=["POST"])
def api_translate_doc():
    try:
        if "document" not in request.files:
            return jsonify({"error": "No document provided"}), 400
        doc_file = request.files["document"]
        direction = request.form.get("direction", "es-en")
        filename = doc_file.filename.lower()
        
        extracted_text = ""
        if filename.endswith(".pdf"):
            reader = PdfReader(doc_file)
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        elif filename.endswith(".docx"):
            doc = docx.Document(doc_file)
            for para in doc.paragraphs:
                if para.text:
                    extracted_text += para.text + "\n"
        elif filename.endswith(".txt"):
            extracted_text = doc_file.read().decode("utf-8")
        else:
            return jsonify({"error": "Unsupported file format. Use PDF, DOCX, or TXT."}), 400

        if not extracted_text.strip():
            return jsonify({"error": "The document is empty or text could not be extracted."}), 400

        # Traducimos el texto extraído (limitado opcionalmente para evitar sobrepasar tokens si el documento es muy extenso)
        translation = translator_service.translate_text(extracted_text[:4000], direction)
        return jsonify({"success": True, "original": extracted_text[:4000], "translation": translation})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)