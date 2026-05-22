// Check if Web Speech API is supported in the browser
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;
let botIsSpeaking = false;

// DOM Elements
const micBtn = document.getElementById('mic-btn');
const micIcon = document.getElementById('mic-icon');
const recordingStatus = document.getElementById('recording-status');
const liveTranscript = document.getElementById('live-transcript');
const chatMessages = document.getElementById('chat-messages');
const ttsStatus = document.getElementById('tts-status');
const clearBtn = document.getElementById('clear-btn');
const downloadBtn = document.getElementById('download-btn');
const refreshLogsBtn = document.getElementById('refresh-logs');
const logsViewer = document.getElementById('logs-viewer');

// Settings Elements
const langSelect = document.getElementById('lang-select');
const voiceSelect = document.getElementById('voice-select');
const rateRange = document.getElementById('rate-range');
const rateVal = document.getElementById('rate-val');
const pitchRange = document.getElementById('pitch-range');
const pitchVal = document.getElementById('pitch-val');
const muteVoiceCheckbox = document.getElementById('mute-voice');

// Canvas Audio Visualizer Elements
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
let animationFrameId = null;
let visualizerState = 'idle'; // 'idle', 'listening', 'speaking'
let wavePhase = 0;

// Initialize canvas dimensions
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
// Call initially
resizeCanvas();

// --- Audio Visualizer Drawing Loop ---
function drawVisualizer() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set colors based on state
    let strokeColor1, strokeColor2, strokeColor3;
    let waveCount = 3;
    let baseAmplitude = 2;
    let frequency = 0.01;
    let speed = 0.02;
    
    if (visualizerState === 'listening') {
        // High frequency active red/pink waves
        strokeColor1 = 'rgba(244, 63, 94, 0.8)';
        strokeColor2 = 'rgba(251, 113, 133, 0.4)';
        strokeColor3 = 'rgba(253, 164, 175, 0.2)';
        baseAmplitude = 18 + Math.random() * 8; // jitter effect
        frequency = 0.03;
        speed = 0.18;
    } else if (visualizerState === 'speaking') {
        // Broad, smooth glowing blue/indigo waves
        strokeColor1 = 'rgba(99, 102, 241, 0.8)';
        strokeColor2 = 'rgba(168, 85, 247, 0.5)';
        strokeColor3 = 'rgba(59, 130, 246, 0.2)';
        baseAmplitude = 24 + Math.sin(wavePhase * 2) * 6; // pulsating smooth wave
        frequency = 0.015;
        speed = 0.08;
    } else {
        // Calm standard idle state (faded cyan/blue flatline)
        strokeColor1 = 'rgba(148, 163, 184, 0.25)';
        strokeColor2 = 'rgba(148, 163, 184, 0.1)';
        strokeColor3 = 'rgba(148, 163, 184, 0.05)';
        baseAmplitude = 2;
        frequency = 0.008;
        speed = 0.02;
    }
    
    const centerY = canvas.height / 2;
    wavePhase += speed;
    
    // Draw 3 layers of overlapping waves for depth
    const waveConfigs = [
        { amp: baseAmplitude, freq: frequency, color: strokeColor1, offset: 0 },
        { amp: baseAmplitude * 0.6, freq: frequency * 1.5, color: strokeColor2, offset: Math.PI / 3 },
        { amp: baseAmplitude * 0.3, freq: frequency * 2, color: strokeColor3, offset: Math.PI / 1.5 }
    ];
    
    waveConfigs.forEach(wave => {
        ctx.beginPath();
        ctx.lineWidth = wave === waveConfigs[0] ? 2.5 : 1.5;
        ctx.strokeStyle = wave.color;
        
        for (let x = 0; x < canvas.width; x++) {
            // Apply a window function so wave starts and ends at 0 amplitude at margins
            const marginWidth = canvas.width * 0.15;
            let scale = 1.0;
            if (x < marginWidth) {
                scale = x / marginWidth;
            } else if (x > canvas.width - marginWidth) {
                scale = (canvas.width - x) / marginWidth;
            }
            
            const y = centerY + Math.sin(x * wave.freq + wavePhase + wave.offset) * wave.amp * scale;
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    });
    
    animationFrameId = requestAnimationFrame(drawVisualizer);
}

// Start drawing visualizer
drawVisualizer();

// --- Speech Recognition (STT) Setup ---
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false; 
    recognition.interimResults = true; 

    // Handle Start Speech Recognition
    recognition.onstart = () => {
        isListening = true;
        visualizerState = 'listening';
        micBtn.className = 'mic-button listening';
        micIcon.className = 'fa-solid fa-microphone-slash';
        recordingStatus.textContent = 'Listening... Speak now';
        recordingStatus.classList.add('active');
        liveTranscript.innerHTML = '<span class="recording-indicator"></span> Listening...';
        liveTranscript.classList.remove('transcript-placeholder');
    };

    // Handle Speech Transcript updates
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript) {
            liveTranscript.textContent = finalTranscript;
        } else {
            liveTranscript.textContent = interimTranscript || "Listening...";
        }
    };

    // Handle Recognition End
    recognition.onend = () => {
        isListening = false;
        visualizerState = 'idle';
        micBtn.className = 'mic-button idle';
        micIcon.className = 'fa-solid fa-microphone';
        recordingStatus.textContent = 'Tap the microphone to start';
        recordingStatus.classList.remove('active');
        
        const queryText = liveTranscript.textContent.trim();
        if (queryText && queryText !== 'Listening...' && queryText !== 'Real-time speech-to-text transcript will appear here as you speak...') {
            sendQueryToBackend(queryText);
        } else {
            liveTranscript.innerHTML = 'Real-time speech-to-text transcript will appear here as you speak...';
            liveTranscript.classList.add('transcript-placeholder');
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech Recognition Error:', event.error);
        recordingStatus.textContent = 'Error: ' + event.error;
        isListening = false;
        visualizerState = 'idle';
        micBtn.className = 'mic-button idle';
        micIcon.className = 'fa-solid fa-microphone';
    };

} else {
    recordingStatus.textContent = 'Speech recognition not supported in this browser. Please use Chrome/Edge.';
    micBtn.disabled = true;
    micBtn.style.opacity = '0.5';
}

function toggleListening() {
    if (!recognition) return;
    
    // Stop synthesis if talking
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        botIsSpeaking = false;
        visualizerState = 'idle';
        ttsStatus.style.display = 'none';
    }

    if (isListening) {
        recognition.stop();
    } else {
        // Set language from selection dropdown dynamically before starting
        recognition.lang = langSelect.value;
        recognition.start();
    }
}

micBtn.addEventListener('click', toggleListening);

// Send message to Flask API
async function sendQueryToBackend(message) {
    addMessageToChat('user', message);
    liveTranscript.textContent = 'Sending message to assistant...';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });

        if (!response.ok) throw new Error('API server response failed');

        const data = await response.json();
        
        if (data.status === 'success') {
            addMessageToChat('bot', data.bot_response);
            liveTranscript.innerHTML = 'Real-time speech-to-text transcript will appear here as you speak...';
            liveTranscript.classList.add('transcript-placeholder');
            
            // Speak response if not muted
            if (!muteVoiceCheckbox.checked) {
                speakResponse(data.bot_response);
            }
            
            loadLogs();
        } else {
            addMessageToChat('bot', 'Error: Could not process request.');
        }
    } catch (error) {
        console.error('API Error:', error);
        addMessageToChat('bot', 'Failed to connect to backend server. Make sure Flask app is running!');
    }
}

function addMessageToChat(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.textContent = text;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    const now = new Date();
    timeSpan.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(timeSpan);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Text-To-Speech (TTS) Setup ---
function speakResponse(text) {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    botIsSpeaking = false;
    visualizerState = 'idle';

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure pitch and speed from settings panel values
    utterance.pitch = parseFloat(pitchRange.value);
    utterance.rate = parseFloat(rateRange.value);

    // Get selected voice profile
    const selectedVoiceURI = voiceSelect.value;
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
    
    if (matchedVoice) {
        utterance.voice = matchedVoice;
    } else {
        // Fallback search
        let fallbackVoice = voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
        if (!fallbackVoice) fallbackVoice = voices.find(v => v.lang === 'te-IN' || v.lang.startsWith('te'));
        if (!fallbackVoice) fallbackVoice = voices.find(v => v.lang === 'en-IN');
        if (fallbackVoice) utterance.voice = fallbackVoice;
    }

    utterance.onstart = () => {
        botIsSpeaking = true;
        visualizerState = 'speaking';
        ttsStatus.style.display = 'flex';
        ttsStatus.querySelector('span').textContent = 'Bot is speaking...';
    };

    utterance.onend = () => {
        botIsSpeaking = false;
        visualizerState = 'idle';
        ttsStatus.style.display = 'none';
    };

    utterance.onerror = () => {
        botIsSpeaking = false;
        visualizerState = 'idle';
        ttsStatus.style.display = 'none';
    };

    window.speechSynthesis.speak(utterance);
}

// Populate Speech Synthesis Voice options dropdown list
function populateVoices() {
    if (!('speechSynthesis' in window)) return;
    
    const voices = window.speechSynthesis.getVoices();
    voiceSelect.innerHTML = '';
    
    if (voices.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'No browser voices found';
        option.value = '';
        voiceSelect.appendChild(option);
        return;
    }

    // Sort voices so Hindi, Telugu, and English (India) are at the top
    const priorityVoices = [];
    const otherVoices = [];
    
    voices.forEach(voice => {
        const l = voice.lang.toLowerCase();
        if (l.includes('hi') || l.includes('te') || (l.includes('en') && l.includes('in'))) {
            priorityVoices.push(voice);
        } else {
            otherVoices.push(voice);
        }
    });

    const combinedVoices = [...priorityVoices, ...otherVoices];
    
    combinedVoices.forEach(voice => {
        const option = document.createElement('option');
        option.textContent = `${voice.name} (${voice.lang})`;
        option.value = voice.voiceURI;
        voiceSelect.appendChild(option);
    });

    // Load saved voice from localStorage if available
    const savedVoiceURI = localStorage.getItem('voice_bot_voice');
    if (savedVoiceURI) {
        voiceSelect.value = savedVoiceURI;
    } else if (priorityVoices.length > 0) {
        // Default to first priority voice
        voiceSelect.value = priorityVoices[0].voiceURI;
    }
}

// Load and display JSON logs
async function loadLogs() {
    try {
        const response = await fetch('/api/logs');
        if (!response.ok) throw new Error('Failed to load logs');
        const data = await response.json();
        
        if (data.length === 0) {
            logsViewer.textContent = '[No log entries loaded]';
            return;
        }

        let logsText = '';
        data.slice(-5).forEach(log => {
            logsText += `[${log.timestamp}] USER: {${log.user_query}}\n`;
            logsText += `[${log.timestamp}] BOT (Intent: ${log.intent}): ${log.bot_response}\n`;
            logsText += `-`.repeat(50) + '\n';
        });
        
        logsViewer.textContent = logsText;
        logsViewer.scrollTop = logsViewer.scrollHeight;
    } catch (err) {
        console.error(err);
        logsViewer.textContent = 'Error loading logs from backend.';
    }
}

// Clear conversation and backend logs
async function clearAll() {
    if (!confirm('Are you sure you want to clear the conversation and logs?')) return;
    
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        botIsSpeaking = false;
        visualizerState = 'idle';
        ttsStatus.style.display = 'none';
    }

    try {
        const response = await fetch('/api/logs/clear', { method: 'POST' });
        const data = await response.json();
        
        if (data.status === 'success') {
            chatMessages.innerHTML = `
                <div class="message bot-message">
                    <div class="message-bubble">
                        Chat and logs have been cleared. Tap the microphone and speak in Hindi or Telugu to start a new chat!
                    </div>
                    <span class="message-time">System</span>
                </div>
            `;
            liveTranscript.innerHTML = 'Real-time speech-to-text transcript will appear here as you speak...';
            liveTranscript.classList.add('transcript-placeholder');
            loadLogs();
        }
    } catch (err) {
        console.error('Error clearing logs:', err);
    }
}

// Handle Raw log download trigger
function downloadLogs() {
    window.location.href = '/api/logs/download';
}

// --- Local Settings Event Handlers & Persistent Storage ---
function loadSettings() {
    const savedLang = localStorage.getItem('voice_bot_lang');
    if (savedLang) langSelect.value = savedLang;

    const savedRate = localStorage.getItem('voice_bot_rate');
    if (savedRate) {
        rateRange.value = savedRate;
        rateVal.textContent = `${savedRate}x`;
    }

    const savedPitch = localStorage.getItem('voice_bot_pitch');
    if (savedPitch) {
        pitchRange.value = savedPitch;
        pitchVal.textContent = savedPitch;
    }

    const savedMute = localStorage.getItem('voice_bot_mute');
    if (savedMute) {
        muteVoiceCheckbox.checked = savedMute === 'true';
    }
}

// Bind setting changes and save to localstorage
langSelect.addEventListener('change', () => {
    localStorage.setItem('voice_bot_lang', langSelect.value);
});

voiceSelect.addEventListener('change', () => {
    localStorage.setItem('voice_bot_voice', voiceSelect.value);
});

rateRange.addEventListener('input', () => {
    rateVal.textContent = `${rateRange.value}x`;
    localStorage.setItem('voice_bot_rate', rateRange.value);
});

pitchRange.addEventListener('input', () => {
    pitchVal.textContent = pitchRange.value;
    localStorage.setItem('voice_bot_pitch', pitchRange.value);
});

muteVoiceCheckbox.addEventListener('change', () => {
    localStorage.setItem('voice_bot_mute', muteVoiceCheckbox.checked);
    if (muteVoiceCheckbox.checked && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        botIsSpeaking = false;
        visualizerState = 'idle';
        ttsStatus.style.display = 'none';
    }
});

// Event Listeners for actions
clearBtn.addEventListener('click', clearAll);
downloadBtn.addEventListener('click', downloadLogs);
refreshLogsBtn.addEventListener('click', loadLogs);

// Initialize voices loading
if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoices;
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    loadSettings();
    populateVoices();
    loadLogs();
});
