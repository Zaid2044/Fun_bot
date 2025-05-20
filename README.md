# Happy Paws Bot 🐾

Happy Paws Bot is a cheerful and enthusiastic web application featuring a bot with the personality of a slightly clueless Golden Retriever. It interacts with users by responding to their text or voice input with playful messages, generating relevant GIFs, and providing text-to-speech audio for its responses.

The bot uses Groq for Large Language Model (LLM) responses, ElevenLabs for Text-to-Speech, Giphy for GIF integration, and Hugging Face Transformers (Whisper) for speech-to-text transcription. The backend is built with Flask (Python), and the frontend is HTML, CSS, and JavaScript.

## Features

*   **Interactive Chat Interface:** Clean and modern UI for user interaction.
*   **Unique Bot Personality:** Responds as a happy, enthusiastic, and slightly clueless Golden Retriever.
*   **Text and Voice Input:** Users can type messages or use their microphone.
*   **Speech-to-Text:** Transcribes user's voice input using OpenAI's Whisper model.
*   **LLM-Generated Responses:** Bot personality and responses powered by LLaMA3 via the Groq API.
*   **Text-to-Speech:** Bot's responses are converted to audio using ElevenLabs.
*   **GIF Integration:** Each bot response is accompanied by a relevant (usually happy/playful) GIF from Giphy.
*   **Light/Dark Mode Theme:** User-selectable interface theme.
*   **Model Selection (Frontend UI):** A dropdown to select different AI models (backend currently defaults to LLaMA3).

## Project Structure


your_project_root_directory/
└── main_folder/
└── bot/
├── .env # Stores API keys (IMPORTANT: Keep this private!)
├── bot.py # Flask backend application
├── index.html # Main HTML file for the frontend
├── requirements.txt # Python dependencies
├── README.md # This file
├── static/
│ ├── script.js # Frontend JavaScript logic
│ └── style.css # CSS styles for the frontend
└── venv/ # Python virtual environment (created by user)

## Prerequisites

*   **Python 3.10+** (Python 3.12 was used during development).
*   **`pip`** (Python package installer).
*   **API Keys:**
    *   Groq API Key ([GroqCloud Console](https://console.groq.com/))
    *   ElevenLabs API Key ([ElevenLabs Website](https://elevenlabs.io/))
    *   Giphy API Key ([Giphy Developers Dashboard](https://developers.giphy.com/dashboard/))
*   A modern web browser (e.g., Chrome, Firefox, Edge).
*   Microphone (for voice input functionality).

## Setup Instructions

Follow these steps to set up and run the Happy Paws Bot locally:

**1. Clone the Repository (if applicable) or Set Up Project Files:**

   If you have this project in a Git repository, clone it. Otherwise, ensure all the files (`bot.py`, `index.html`, `requirements.txt`, and the `static` folder with `script.js` and `style.css`) are in your project's `bot` directory as per the structure above.

**2. Create and Activate a Python Virtual Environment:**

   It is highly recommended to use a virtual environment to manage project dependencies.

   Open your terminal or command prompt, navigate to the project's `bot` directory:
   ```bash
   cd path/to/your/main_folder/bot
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
IGNORE_WHEN_COPYING_END

Create the virtual environment:

python -m venv venv
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Bash
IGNORE_WHEN_COPYING_END

Activate the virtual environment:

Windows (PowerShell):

.\venv\Scripts\Activate.ps1
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Powershell
IGNORE_WHEN_COPYING_END

(If you encounter an execution policy error, you might need to run Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process first in that PowerShell session.)

Windows (Command Prompt):

.\venv\Scripts\activate.bat
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Cmd
IGNORE_WHEN_COPYING_END

macOS / Linux:

source venv/bin/activate
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Bash
IGNORE_WHEN_COPYING_END

Your terminal prompt should now indicate that the (venv) is active.

3. Install Python Dependencies:

With the virtual environment active, install the required Python packages using the requirements.txt file:

pip install -r requirements.txt
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Bash
IGNORE_WHEN_COPYING_END

This will install Flask, Flask-CORS, python-dotenv, requests, groq, elevenlabs, transformers, torch, torchvision, torchaudio, and sentencepiece. The torch installation will be CPU-based by default.

4. Set Up API Keys in .env File:

a. In the bot directory, create a file named .env (if it doesn't already exist).

b. Add your API keys to this .env file in the following format, replacing the placeholder values with your actual keys:
env GROQ_API_KEY="your_actual_groq_api_key" ELEVEN_API_KEY="your_actual_elevenlabs_api_key" GIPHY_API_KEY="your_actual_giphy_api_key"

c. IMPORTANT: Ensure this .env file is never committed to public repositories. Add .env to your .gitignore file.

How to Run the Bot

1. Start the Flask Backend Server:

Ensure your virtual environment (venv) is active and you are in the bot directory.
Run the Python application:

python bot.py
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Bash
IGNORE_WHEN_COPYING_END

You should see output indicating the Flask server is running, typically on http://127.0.0.1:5000 or http://localhost:5000. The output will also confirm that the Whisper model is loading (this might take a few moments the first time as models are downloaded).

Example output:

(venv) ...> python bot.py
[TIMESTAMP] INFO in bot: Using device: cpu for Whisper model
... (model loading messages) ...
[TIMESTAMP] INFO in bot: Whisper model loaded successfully.
 * Serving Flask app 'bot'
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment.
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
...
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
IGNORE_WHEN_COPYING_END

2. Access the Bot in Your Web Browser:

Open your web browser and navigate to:

http://localhost:5000/
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
IGNORE_WHEN_COPYING_END

(or http://127.0.0.1:5000/)

You should see the "Happy Paws Bot" interface.

3. Interact with the Bot:

Type a message in the input field and click the "Chat!" button (or press Enter).

Click the microphone icon to record your voice (your browser will ask for microphone permission).

The bot will respond with text, a GIF, and an audio playback button.

4. Stop the Bot:

To stop the Flask server, go back to your terminal where python bot.py is running and press CTRL+C.

Development Notes

CORS Configuration: The bot.py is configured with CORS(app, resources={r"/*": {"origins": "*"}}) which allows requests from any origin during development. For production, you should restrict this to your frontend's actual domain.

Frontend Development with Live Server: If you are actively editing index.html, style.css, or script.js, you can use a Live Server extension (like the one in VS Code) which typically runs on a different port (e.g., http://localhost:5500). The API_BASE_URL in script.js is set to http://localhost:5000 to ensure it correctly targets the Python backend. The CORS setup in bot.py will allow these cross-origin requests from the Live Server port during development. However, for full application testing, always access the bot via the Flask server's address (http://localhost:5000/).

Whisper Model: The openai/whisper-base model is used. Other Whisper model sizes can be used by changing WHISPER_MODEL_NAME in bot.py (e.g., openai/whisper-small, openai/whisper-medium), but they will require more resources and download time.

ElevenLabs Voice: The voice ID pNInz6obpgDQGcFmaJgB (Rachel) is used. You can change ELEVENLABS_VOICE_ID in bot.py to use any other voice available in your ElevenLabs account. Voice settings (stability, style) can also be tweaked in the text_to_speech function.

Troubleshooting

Python/Pip Not Found: Ensure Python is installed correctly and its installation directory (and its Scripts subdirectory) are added to your system's PATH environment variable. Disable Microsoft Store app execution aliases for python.exe if they interfere.

Dependency Errors (e.g., ml_dtypes): These often indicate incompatible package versions. The most reliable fix is to create a completely fresh virtual environment and reinstall dependencies using pip install -r requirements.txt. Ensure you are using a compatible Python version (3.10-3.12 recommended).

API Key Errors:

Double-check that your .env file is in the correct directory (same as bot.py).

Verify the names of the keys in .env exactly match (GROQ_API_KEY, ELEVEN_API_KEY, GIPHY_API_KEY).

Ensure your API keys are active and have sufficient quota/credits on the respective service dashboards.

"Failed to fetch" in Browser:

Check the browser's developer console (F12) for detailed error messages (often CORS related).

Ensure the Flask backend server (python bot.py) is running and accessible.

Verify the API_BASE_URL in script.js correctly points to your Flask server (e.g., http://localhost:5000).

Static Files (CSS/JS) Not Loading (404 errors in Flask log):

Ensure style.css and script.js are inside a static subfolder in the same directory as bot.py.

Confirm app = Flask(__name__, template_folder='.', static_folder='static') is set in bot.py.

Ensure index.html uses {{ url_for('static', filename='style.css') }} etc.

Access the application via the Flask server URL (http://localhost:5000/), not directly by opening index.html or via a generic Live Server URL for the HTML file itself.

Enjoy your Happy Paws Bot! 🐶
