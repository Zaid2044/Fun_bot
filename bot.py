import os
import base64
import uuid
import tempfile
import random
import logging

from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
from groq import Groq, GroqError
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings
from dotenv import load_dotenv
from transformers import pipeline
import torch
import requests

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")
GIPHY_API_KEY = os.getenv("GIPHY_API_KEY")

if not all([GROQ_API_KEY, ELEVEN_API_KEY, GIPHY_API_KEY]):
    raise ValueError("One or more API keys are missing in .env file.")

LLAMA_MODEL = "llama3-70b-8192"
LLAMA_TEMPERATURE = 1.0
LLAMA_MAX_TOKENS = 250
LLAMA_SYSTEM_PROMPT = (
    "You are a very happy, slightly clueless, and extremely enthusiastic Golden Retriever. "
    "You love everyone and everything! You try your best to understand, but sometimes you get things adorably wrong. "
    "Respond with pure joy and perhaps a bit of silly confusion. "
    "Always end your response with 'GIF:' followed by a 2-3 word search term for a happy or playful GIF (like 'dog wagging tail' or 'happy dance')."
)

ELEVENLABS_VOICE_ID = "pNInz6obpgDQGcFmaJgB"
ELEVENLABS_MODEL_ID = "eleven_turbo_v2_5"
ELEVENLABS_OUTPUT_FORMAT = "mp3_22050_32"

GIPHY_LIMIT = 10
GIPHY_RATING = "g"
GIPHY_FALLBACK_URL = "https://media.giphy.com/media/RBeddeaQ5Xo0E/giphy.gif" # A happy dog gif: https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2dudnZqcmJtbGRuNmxkdXQ5ZnJzYmVycjRydXFmMHZlM3Y0bnY5ayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5PhDd9sAUbI71G3Dgr/giphy.gif

WHISPER_MODEL_NAME = "openai/whisper-base"

app = Flask(__name__,
            template_folder='.',
            static_folder='static'
            )
CORS(app, resources={r"/*": {"origins": "*"}})

app.logger.setLevel(logging.INFO)
log_handler = logging.StreamHandler()
log_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
app.logger.addHandler(log_handler)

try:
    groq_client = Groq(api_key=GROQ_API_KEY)
    eleven_labs = ElevenLabs(api_key=ELEVEN_API_KEY)
except Exception as e:
    app.logger.error(f"Failed to initialize API clients: {e}")
    raise

try:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    app.logger.info(f"Using device: {device} for Whisper model")
    whisper_model = pipeline(
        "automatic-speech-recognition",
        model=WHISPER_MODEL_NAME,
        device=device
    )
    app.logger.info("Whisper model loaded successfully.")
except Exception as e:
    app.logger.error(f"Failed to load Whisper model: {e}")
    whisper_model = None

def get_bot_response(user_prompt_content: str) -> str | None:
    try:
        response = groq_client.chat.completions.create(
            model=LLAMA_MODEL,
            messages=[
                {"role": "system", "content": LLAMA_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt_content}
            ],
            temperature=LLAMA_TEMPERATURE,
            max_tokens=LLAMA_MAX_TOKENS
        )
        return response.choices[0].message.content
    except GroqError as e:
        app.logger.error(f"Groq API error: {e}")
    except Exception as e:
        app.logger.error(f"Error getting bot response: {e}")
    return None

def text_to_speech(text: str) -> str | None:
    if not text:
        app.logger.warning("TTS called with empty text.")
        return None
    try:
        response_audio_iterator = eleven_labs.text_to_speech.convert(
            voice_id=ELEVENLABS_VOICE_ID,
            text=text,
            model_id=ELEVENLABS_MODEL_ID,
            output_format=ELEVENLABS_OUTPUT_FORMAT,
            voice_settings=VoiceSettings(
                stability=0.3,
                similarity_boost=0.75,
                style=0.2,
                use_speaker_boost=True
            )
        )
        audio_bytes = b"".join(chunk for chunk in response_audio_iterator if chunk)
        if not audio_bytes:
            app.logger.error("ElevenLabs TTS returned no audio data.")
            return None
        encoded_audio = base64.b64encode(audio_bytes).decode("utf-8")
        return encoded_audio
    except Exception as e:
        error_module = getattr(type(e), '__module__', '').lower()
        if 'elevenlabs' in error_module:
            app.logger.error(f"ElevenLabs API error: {e} (Type: {type(e)})")
        else:
            app.logger.error(f"TTS error (non-ElevenLabs specific): {e} (Type: {type(e)})")
    return None

def fetch_gif(search_term: str) -> str:
    if not search_term:
        app.logger.warning("Fetch GIF called with empty search term, using fallback.")
        return GIPHY_FALLBACK_URL
    params = {
        "api_key": GIPHY_API_KEY,
        "q": search_term,
        "limit": GIPHY_LIMIT,
        "rating": GIPHY_RATING,
        "lang": "en"
    }
    try:
        response = requests.get("https://api.giphy.com/v1/gifs/search", params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data.get("data"):
            return random.choice(data["data"])["images"]["original"]["url"]
        else:
            app.logger.warning(f"No GIFs found for term: '{search_term}', using fallback.")
            return GIPHY_FALLBACK_URL
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Giphy API request error: {e}")
    except (KeyError, IndexError, TypeError) as e:
        app.logger.error(f"Error processing Giphy response: {e}")
    except Exception as e:
        app.logger.error(f"Unexpected error fetching GIF: {e}")
    return GIPHY_FALLBACK_URL

def split_bot_response_and_gif_prompt(text_with_gif_marker: str) -> tuple[str, str]:
    if 'GIF:' in text_with_gif_marker:
        bot_text, gif_search_prompt = text_with_gif_marker.split('GIF:', 1)
        return bot_text.strip(), gif_search_prompt.strip()
    app.logger.warning("GIF: marker not found in LLaMA response. Using default GIF prompt.")
    return text_with_gif_marker.strip(), "happy dog"

@app.route('/roast', methods=['POST'])
def main_bot_endpoint():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 415
    data = request.get_json()
    user_input = data.get("text")

    if not user_input:
        return jsonify({"error": "No text provided"}), 400
    if len(user_input) > 500:
        return jsonify({"error": "Input text too long"}), 413

    full_response = get_bot_response(user_input)
    if not full_response:
        return jsonify({"error": "Failed to get response from bot"}), 500

    bot_text, gif_prompt_text = split_bot_response_and_gif_prompt(full_response)
    gif_url = fetch_gif(gif_prompt_text)
    audio_base64 = text_to_speech(bot_text)

    if audio_base64 is None:
        app.logger.warning("Audio generation failed, returning response without audio.")

    return jsonify({
        "roast": bot_text,
        "gif": gif_url,
        "audio": audio_base64
    })

@app.route('/transcribe', methods=['POST'])
def transcribe_endpoint():
    if whisper_model is None:
        app.logger.error("Transcription attempt failed: Whisper model not loaded.")
        return jsonify({"error": "Transcription service is currently unavailable."}), 503
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file part in the request'}), 400
    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({'error': 'No selected audio file'}), 400
    temp_audio_path = None
    try:
        suffix = os.path.splitext(audio_file.filename)[1] if os.path.splitext(audio_file.filename)[1] else ".wav"
        with tempfile.NamedTemporaryFile(delete=False, dir=tempfile.gettempdir(), suffix=suffix) as tmp_f:
            audio_file.save(tmp_f.name)
            temp_audio_path = tmp_f.name
        app.logger.info(f"Transcribing audio file: {temp_audio_path}")
        transcription_result = whisper_model(temp_audio_path)
        text = transcription_result["text"]
        return jsonify({'transcription': text})
    except Exception as e:
        app.logger.error(f"Error during transcription: {e}")
        return jsonify({'error': f'Transcription failed: {str(e)}'}), 500
    finally:
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.unlink(temp_audio_path)
                app.logger.info(f"Deleted temporary audio file: {temp_audio_path}")
            except OSError as e:
                app.logger.error(f"Error deleting temporary file {temp_audio_path}: {e}")

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)