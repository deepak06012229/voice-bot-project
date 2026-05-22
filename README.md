# Bolo Mitra | Hindi + Telugu Multilingual Voice Bot
Bolo Mitra is an interactive, multilingual AI-based voice assistant designed to process and respond to Hindi, Telugu, and English conversations in real time. 
The application utilizes browser-native Speech-to-Text (STT) and Text-to-Speech (TTS) technologies integrated with a Python Flask rule-based conversational AI engine and file-based transaction logging.
---
## 🌟 Key Features
* **Real-time Speech Recognition (STT):** Captures voice input via microphone and outputs live, word-by-word transcripts as you speak using the Web Speech API.
* **Natural Voice Playback (TTS):** Reads out bot replies using browser SpeechSynthesis, with priority filtering for native Indian voice engines (`hi-IN`, `te-IN`, `en-IN`).
* **Siri-Style Waveform Visualizer:** An interactive, state-aware HTML5 canvas rendering waveforms:
  * **Idle:** Calm, slow-moving wave.
  * **Listening:** Dynamic, high-frequency pink waveform matching audio capture.
  * **Speaking:** Large, smooth blue-purple harmonic waves synced to TTS output.
* **Voice & Language Settings:**
  * Adjust speech speed (0.5x to 2.0x) and speech pitch.
  * Pick from your system's installed voice engines.
  * Swap input recognition language dynamically.
  * Toggle Bot Voice Mute.
* **Persistent Settings:** Layout options auto-save to browser `localStorage` and persist through page reloads.
* **Dual Conversation Logging:** Saves chats to both a text log (`logs.txt`) and a structured JSON log (`logs.json`).
* **Logs Downloader & Monitor:** View logs live in the dashboard, clear logs, or download the raw session history (`logs.txt`).
* **Glassmorphism Interface:** Sleek, responsive, dark-themed dashboard.
---
## 📁 Folder Structure
```text
voice-bot-project/
│
├── app.py                # Python Flask server & rule-based conversational AI engine
├── logs.txt              # Standard text logs (automatically created)
├── logs.json             # Structured JSON database logs (automatically created)
├── README.md             # Project documentation & run guide
│
├── static/               # Client-side static assets
│   ├── script.js         # Voice processing (STT & TTS), canvas drawing, API client
│   └── style.css         # Modern glassmorphism stylesheet, sliders, and animation rules
│
└── templates/            # Served HTML templates
    └── index.html        # Main dashboard containing panels, settings, and logs
```
---
## 🚀 Setup & Execution Guide
### Prerequisites
Make sure you have **Python 3.x** and **Flask** installed on your system. 
If Flask is not installed, install it via:
```bash
pip install Flask
```
### Starting the Server
1. Open PowerShell or Command Prompt.
2. Navigate to the project directory:
   ```powershell
   cd "c:\Users\Deepak\OneDrive\Desktop\voice-bot-project"
   ```
3. Start the Flask application:
   ```powershell
   python app.py
   ```
4. Keep the terminal running. Open a Web Speech-supported browser (such as **Google Chrome** or **Microsoft Edge**) and visit:
   [http://127.0.0.1:5000](http://127.0.0.1:5000)
5. Click **Allow** when the browser prompts for microphone permissions.
---
## 💬 Conversation Triggers & Trilingual Responses
Bolo Mitra matches keywords for different intents and replies in appropriate scripts or Romanized transliterations (Hinglish/Telglish):
|
 Intent Category 
|
 Try Speaking (English / Hindi / Telugu) 
|
|
:---
|
:---
|
|
**
Greetings
**
|
*
"Hello"
*
, 
*
"Namaste"
*
, 
*
"Namaskaram"
*
, 
*
"Kaise ho?"
*
, 
*
"Ela unnav?"
*
|
|
**
Identity
**
|
*
"Who are you?"
*
, 
*
"Tumhara naam kya hai?"
*
, 
*
"Nee peru enti?"
*
|
|
**
Help & Capabilities
**
|
*
"Help me"
*
, 
*
"Madad karo"
*
, 
*
"Sahayam kavali"
*
, 
*
"What can you do?"
*
|
|
**
Jokes / Fun
**
|
*
"Tell me a joke"
*
, 
*
"Chutkula sunao"
*
, 
*
"Joke cheppu"
*
|
