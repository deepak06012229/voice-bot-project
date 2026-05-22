import os
import json
import re
import random
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_file

app = Flask(__name__)

# File paths for storing logs
LOGS_TXT_PATH = "logs.txt"
LOGS_JSON_PATH = "logs.json"

# Helper function to append log to logs.txt and logs.json
def write_logs(user_query, bot_response, intent):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # 1. Write to logs.txt
    try:
        with open(LOGS_TXT_PATH, "a", encoding="utf-8") as txt_file:
            txt_file.write(f"[{timestamp}] USER: {user_query}\n")
            txt_file.write(f"[{timestamp}] BOT (Intent: {intent}): {bot_response}\n")
            txt_file.write("-" * 80 + "\n")
    except Exception as e:
        print(f"Error writing to logs.txt: {e}")

    # 2. Write to logs.json
    try:
        log_entry = {
            "timestamp": timestamp,
            "user_query": user_query,
            "bot_response": bot_response,
            "intent": intent
        }
        
        # Load existing logs if file exists
        if os.path.exists(LOGS_JSON_PATH) and os.path.getsize(LOGS_JSON_PATH) > 0:
            with open(LOGS_JSON_PATH, "r", encoding="utf-8") as json_file:
                try:
                    logs_list = json.load(json_file)
                except json.JSONDecodeError:
                    logs_list = []
        else:
            logs_list = []
            
        logs_list.append(log_entry)
        
        # Write back to logs.json
        with open(LOGS_JSON_PATH, "w", encoding="utf-8") as json_file:
            json.dump(logs_list, json_file, indent=4, ensure_ascii=False)
            
    except Exception as e:
        print(f"Error writing to logs.json: {e}")

# Rule-based conversational logic
def get_bot_response(user_query):
    # Normalize query (lowercase, strip whitespace)
    query_clean = user_query.strip().lower()
    
    # Define keywords/regex patterns for Hindi, Telugu, and mixed Romanized forms
    
    # GREETINGS: namaste, namaskaram, hello, hi, ram ram, etc.
    greetings_patterns = [
        r'\bhello\b', r'\bhi\b', r'\bhey\b',
        r'नमस्ते', r'नमस्कार', r'राम राम',
        r'నమస్కారం', r'హలో',
        r'\bnamaste\b', r'\bnamaskaram\b', r'\bnamaskara\b', r'\bram ram\b', r'\bkaise ho\b', r'\bela unnav\b'
    ]
    
    # NAME INTRODUCTION: what is your name, nee peru enti, tumhara naam kya hai, etc.
    name_patterns = [
        r'name', r'नाम', r'పేరు',
        r'who are you', r'कौन हो', r'ఎవరు',
        r'tumhara naam', r'aapka naam', r'nee peru', r'mee peru',
        r'tera naam'
    ]
    
    # HELP/DEMO: help, madad, sahayam, what can you do, etc.
    help_patterns = [
        r'help', r'madad', r'sahayam', r'demo',
        r'मदद', r'सहायता', r'సహాయం',
        r'kya kar sakte ho', r'nuvvu emi cheyagalavu', r'what can you do',
        r'features', r'instructions'
    ]

    # JOKES: joke, chutkula, chutkulu, etc.
    joke_patterns = [
        r'joke', r'chutkula', r'chutkule', r'chutkulu', r'comedy',
        r'चुटकुला', r'मजाक', r'జోక్', r'హాస్యం'
    ]
    
    # Match patterns and determine response + intent
    
    # 1. Name query check
    if any(re.search(pattern, query_clean) for pattern in name_patterns):
        intent = "name_introduction"
        response = (
            "मेरा नाम 'बोलो मित्र' (Bolo Mitra) है! నా పేరు 'బోలో మిత్ర'. "
            "I am your multilingual voice assistant designed to help you in Hindi, Telugu, and English."
        )
        return response, intent
        
    # 2. Help query check
    elif any(re.search(pattern, query_clean) for pattern in help_patterns):
        intent = "help_demo"
        response = (
            "आप मुझसे हिंदी या तेलुगु में बात कर सकते हैं! "
            "మీరు నాతో హిందీ లేదా తెలుగులో మాట్లాడవచ్చు. "
            "Try asking me: 'Hello', 'Tumhara naam kya hai?', or 'Tell me a joke'. "
            "I will respond in both text and voice!"
        )
        return response, intent

    # 3. Joke query check
    elif any(re.search(pattern, query_clean) for pattern in joke_patterns):
        intent = "jokes"
        jokes_list = [
            "एक बार एक हैदराबादी और एक दिल्ली का लड़का मिले। दिल्ली वाला बोला: 'मेरे पास बंगला है, गाड़ी है, बैंक बैलेंस है!' हैदराबादी ने मुस्कुराकर कहा: 'मेरे पास उस्मानिया बिस्कुट और ईरानी चाय है, भाई! बैगन के बातां नको करो, चलो चाय पीते हैं!' 😂",
            "Here is a funny Telugu-Hindi mixed joke! రాము స్కూల్ నుండి ఆలస్యంగా వచ్చాడు. నాన్న అడిగారు: 'Enduku late aindi?' రాము: 'నాన్న, ఒకాయన వంద రూపాయల నోటు పోగొట్టుకున్నాడు.' నాన్న: 'మరి నువ్వు అతనికి సహాయం చేసావా?' రాము: 'లేదు నాన్న, నేను ఆ నోటు మీద నిలబడి ఉన్నాను, ఆయన వెళ్ళిపోయాక తీసుకుని వచ్చాను!' 😂",
            "Why did the computer go to the doctor? ఎందుకంటే దానికి వైరస్ వచ్చింది! Aur computer ne bhagte hue bola: 'Mujhe bukhar hai, saare files delete ho rahe hain!' 💻"
        ]
        response = random.choice(jokes_list)
        return response, intent

    # 4. Greeting query check
    elif any(re.search(pattern, query_clean) for pattern in greetings_patterns):
        intent = "greetings"
        response = (
            "नमस्ते! నమస్కారం! Hello! "
            "Main aapka multilingual voice assistant hoon. Nenu meeku ela sahayapadagalanu? "
            "How can I assist you today?"
        )
        return response, intent
        
    # Fallback response for unhandled inputs
    else:
        intent = "fallback"
        response = (
            "मुझे समझ नहीं आया। आप 'नमस्ते' या 'तुम्हारा नाम क्या है' पूछ सकते हैं, या एक 'चुटकुला' सुन सकते हैं। "
            "నాకు అర్థం కాలేదు. మీరు 'నమస్కారం' లేదా 'నీ పేరు ఏమిటి' అని అడగవచ్చు, లేదా ఒక జోక్ చెప్పమని అడగండి."
        )
        return response, intent

# ----------------- Flask Routes -----------------

@app.route("/")
def index():
    """Serves the main frontend page."""
    return render_template("index.html")

@app.route("/api/chat", methods=["POST"])
def chat():
    """Endpoint to process text query and return chatbot response."""
    data = request.get_json() or {}
    user_message = data.get("message", "").strip()
    
    if not user_message:
        return jsonify({
            "status": "error",
            "message": "Message is required"
        }), 400
        
    # Process text using rule engine
    bot_reply, intent = get_bot_response(user_message)
    
    # Store history log
    write_logs(user_message, bot_reply, intent)
    
    return jsonify({
        "status": "success",
        "user_message": user_message,
        "bot_response": bot_reply,
        "intent": intent
    })

@app.route("/api/logs", methods=["GET"])
def get_logs():
    """Endpoint to fetch all JSON logs for UI display."""
    if os.path.exists(LOGS_JSON_PATH):
        try:
            with open(LOGS_JSON_PATH, "r", encoding="utf-8") as f:
                logs = json.load(f)
                return jsonify(logs)
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500
    return jsonify([])

@app.route("/api/logs/clear", methods=["POST"])
def clear_logs():
    """Endpoint to clear log files."""
    try:
        # Clear JSON log file
        with open(LOGS_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump([], f)
        # Clear Text log file
        with open(LOGS_TXT_PATH, "w", encoding="utf-8") as f:
            f.write("")
        return jsonify({"status": "success", "message": "Logs cleared successfully"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/logs/download", methods=["GET"])
def download_logs():
    """Endpoint to download the raw text logs as a file attachment."""
    if os.path.exists(LOGS_TXT_PATH):
        try:
            return send_file(
                LOGS_TXT_PATH,
                mimetype="text/plain",
                as_attachment=True,
                download_name="voice_bot_conversation_logs.txt"
            )
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500
    else:
        # Create empty log file if it doesn't exist
        try:
            with open(LOGS_TXT_PATH, "w", encoding="utf-8") as f:
                f.write("--- Hindi + Telugu Voice Bot Session Logs ---\n")
            return send_file(
                LOGS_TXT_PATH,
                mimetype="text/plain",
                as_attachment=True,
                download_name="voice_bot_conversation_logs.txt"
            )
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    # Run the Flask app on localhost, port 5000
    app.run(debug=True, host="127.0.0.1", port=5000)
