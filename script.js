'use strict';

const API_BASE_URL = 'http://localhost:5000';
const TRANSCRIBE_ENDPOINT = `${API_BASE_URL}/transcribe`;
const ROAST_ENDPOINT = `${API_BASE_URL}/roast`;
const GIPHY_FALLBACK_URL_JS = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2dudnZqcmJtbGRuNmxkdXQ5ZnJzYmVycjRydXFmMHZlM3Y0bnY5ayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5PhDd9sAUbI71G3Dgr/giphy.gif";
let themeToggleButton, modelSelectElement, chatContainerElement, userInputElement, voiceButtonElement, chatFormElement, roastButtonElement;
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired. Caching elements.");
    themeToggleButton = document.getElementById('themeToggle');
    modelSelectElement = document.getElementById('modelSelect');
    chatContainerElement = document.getElementById('chatContainer');
    userInputElement = document.getElementById('userInput');
    voiceButtonElement = document.getElementById('voiceButton');
    chatFormElement = document.getElementById('chatForm');
    roastButtonElement = document.getElementById('roastButton');
    console.log("chatContainerElement on DOMContentLoaded:", chatContainerElement);

    const savedTheme = localStorage.getItem('theme') || document.documentElement.getAttribute('data-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButtonIcon(savedTheme);

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }
    if (voiceButtonElement) {
        voiceButtonElement.addEventListener('click', handleVoiceButtonClick);
    }
    if (chatFormElement) {
        chatFormElement.addEventListener('submit', handleChatFormSubmit);
    }

    displayWelcomeMessage();
});

function displayWelcomeMessage() {
    console.log("Attempting to display welcome message.");
    console.log("chatContainerElement inside displayWelcomeMessage:", chatContainerElement);
    if (!chatContainerElement) {
        console.error("Welcome message cannot be displayed: chatContainerElement is null!");
        return;
    }
    const welcomeText = "Woof woof! I'm Happy Paws, your friendly neighborhood Golden Retriever bot! I love treats, walks, and making new friends! What can I do for you today? Maybe a ball? Or a chat? Tail wags for everyone! GIF: happy dog jumping";
    const [botText, gifSearchTerm] = splitBotTextAndGifSearchTerm(welcomeText);
    const gifUrl = GIPHY_FALLBACK_URL_JS;
    console.log("Welcome message text:", botText);
    console.log("Welcome message GIF URL:", gifUrl);
    addBotResponseToChat(botText, gifUrl, null);
    console.log("Welcome message should have been added to chat.");
}

function splitBotTextAndGifSearchTerm(textWithMarker) {
    console.log("Splitting text for GIF marker:", textWithMarker);
    if (textWithMarker && textWithMarker.includes('GIF:')) {
        const parts = textWithMarker.split('GIF:');
        console.log("Split into:", parts);
        return [parts[0].trim(), parts[1].trim()];
    }
    console.log("No GIF marker, using default GIF search term.");
    return [textWithMarker, "happy dog"];
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButtonIcon(newTheme);
}

function updateThemeButtonIcon(theme) {
    if (!themeToggleButton) return;
    const lightIcon = themeToggleButton.querySelector('.light-icon');
    const darkIcon = themeToggleButton.querySelector('.dark-icon');
    if (lightIcon && darkIcon) {
        lightIcon.style.display = theme === 'dark' ? 'inline-block' : 'none';
        darkIcon.style.display = theme === 'light' ? 'inline-block' : 'none';
    }
}

function handleVoiceButtonClick() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecordingAndProcess();
    }
}

async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Media Devices API not supported by your browser.');
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        mediaRecorder.onstop = async () => {
            if (mediaRecorder && mediaRecorder.stream) {
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
            if (audioChunks.length === 0) {
                console.warn('No audio data recorded.');
                updateRecordingUI(false);
                return;
            }
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            await sendAudioToServer(audioBlob);
        };
        mediaRecorder.start();
        updateRecordingUI(true);
    } catch (error) {
        console.error('Error accessing microphone:', error);
        let message = 'Could not access your microphone. Please check permissions.';
        if (error.name === 'NotAllowedError') message = 'Microphone access denied. Please enable it in browser settings.';
        else if (error.name === 'NotFoundError') message = 'No microphone found. Ensure it is connected.';
        alert(message);
        updateRecordingUI(false);
    }
}

function stopRecordingAndProcess() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        updateRecordingUI(false);
    }
}

function updateRecordingUI(isNowRecording) {
    isRecording = isNowRecording;
    if (voiceButtonElement) {
        if (isRecording) {
            voiceButtonElement.classList.add('recording');
            voiceButtonElement.title = 'Stop recording';
            voiceButtonElement.innerHTML = '<span class="mic-icon recording-icon" aria-hidden="true">⏹️</span><span class="control-text"> Stop</span>';
        } else {
            voiceButtonElement.classList.remove('recording');
            voiceButtonElement.title = 'Record voice';
            voiceButtonElement.innerHTML = '<span class="mic-icon" aria-hidden="true">🎤</span>';
        }
    }
}

async function sendAudioToServer(audioBlob) {
    if (!userInputElement) return;
    const originalPlaceholder = userInputElement.placeholder;
    const originalValue = userInputElement.value;
    userInputElement.value = 'Thinking... *wags tail*';
    setControlsDisabled(true);

    try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');
        const response = await fetch(TRANSCRIBE_ENDPOINT, { method: 'POST', body: formData });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        const data = await response.json();
        userInputElement.value = data.transcription || '';
    } catch (error) {
        console.error('Transcription error:', error);
        alert(`Woops! I couldn't understand that: ${error.message}. Try again?`);
        userInputElement.value = originalValue;
    } finally {
        userInputElement.placeholder = originalPlaceholder;
        setControlsDisabled(false);
        userInputElement.focus();
    }
}

async function handleChatFormSubmit(event) {
    event.preventDefault();
    await getRoast();
}

async function getRoast() {
    if (!userInputElement || !chatContainerElement) return;
    const userText = userInputElement.value.trim();
    const modelChoice = modelSelectElement ? modelSelectElement.value : 'llama3-70b-8192';
    if (!userText) {
        userInputElement.focus();
        return;
    }
    addMessageToChat(userText, 'user');
    userInputElement.value = '';
    setControlsDisabled(true);

    try {
        const response = await fetch(ROAST_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: userText, model: modelChoice })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        addBotResponseToChat(data.roast, data.gif, data.audio);
    } catch (error) {
        console.error('Bot Error:', error);
        addMessageToChat(`Oh noes! Something went a bit bark-wards: ${error.message}. Maybe try again? *tilts head*`, 'bot-error');
    } finally {
        setControlsDisabled(false);
        userInputElement.focus();
    }
}

function setControlsDisabled(isDisabled) {
    const controlsToToggle = [userInputElement, modelSelectElement, voiceButtonElement, roastButtonElement];
    controlsToToggle.forEach(control => {
        if (control) {
            control.disabled = isDisabled;
        }
    });
}

function addMessageToChat(text, type) {
    if (!chatContainerElement || !text) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    const contentDiv = document.createElement('p');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    messageDiv.appendChild(contentDiv);
    chatContainerElement.appendChild(messageDiv);
    scrollToBottom();
}

function addBotResponseToChat(responseText, gifUrl, audioBase64) {
    if (!chatContainerElement) return;
    const botMessageDiv = document.createElement('div');
    botMessageDiv.className = 'message bot';
    if (responseText) {
        const responseP = document.createElement('p');
        responseP.className = 'message-content bot-text';
        responseP.textContent = responseText;
        botMessageDiv.appendChild(responseP);
    }
    if (gifUrl) {
        const gifContainer = document.createElement('div');
        gifContainer.className = 'gif-container';
        const gifImage = document.createElement('img');
        gifImage.src = gifUrl;
        gifImage.alt = "Playful GIF";
        gifImage.onerror = () => { gifImage.style.display = 'none'; };
        gifContainer.appendChild(gifImage);
        botMessageDiv.appendChild(gifContainer);
    }
    if (audioBase64) {
        const audioPlayer = document.createElement('audio');
        audioPlayer.src = `data:audio/mpeg;base64,${audioBase64}`;
        const audioControl = document.createElement('button');
        audioControl.className = 'audio-control';
        const playIconSpan = document.createElement('span');
        playIconSpan.className = 'play-icon';
        playIconSpan.setAttribute('aria-hidden', 'true');
        playIconSpan.textContent = '🔊';
        const pauseIconSpan = document.createElement('span');
        pauseIconSpan.className = 'pause-icon';
        pauseIconSpan.setAttribute('aria-hidden', 'true');
        pauseIconSpan.style.display = 'none';
        pauseIconSpan.textContent = '⏸️';
        const controlTextSpan = document.createElement('span');
        controlTextSpan.className = 'control-text';
        controlTextSpan.textContent = ' Hear me bark!';
        audioControl.appendChild(playIconSpan);
        audioControl.appendChild(pauseIconSpan);
        audioControl.appendChild(controlTextSpan);
        audioControl.onclick = function() {
            toggleDynamicAudio(this, audioPlayer, playIconSpan, pauseIconSpan, controlTextSpan);
        };
        botMessageDiv.appendChild(audioControl);
        botMessageDiv.appendChild(audioPlayer);
        audioPlayer.onplay = () => {
            playIconSpan.style.display = 'none';
            pauseIconSpan.style.display = 'inline';
            controlTextSpan.textContent = ' Shhh!';
            audioControl.classList.add('playing');
        };
        audioPlayer.onpause = () => {
            playIconSpan.style.display = 'inline';
            pauseIconSpan.style.display = 'none';
            controlTextSpan.textContent = ' Hear me bark!';
            audioControl.classList.remove('playing');
        };
    }
    chatContainerElement.appendChild(botMessageDiv);
    scrollToBottom();
}

function toggleDynamicAudio(button, audioPlayer, playIcon, pauseIcon, textSpan) {
    if (!audioPlayer) return;
    document.querySelectorAll('.message.bot audio').forEach(otherAudio => {
        if (otherAudio !== audioPlayer && !otherAudio.paused) {
            otherAudio.pause();
            const otherButton = otherAudio.previousElementSibling;
            if (otherButton && otherButton.classList.contains('audio-control')) {
                const otherPlayIcon = otherButton.querySelector('.play-icon');
                const otherPauseIcon = otherButton.querySelector('.pause-icon');
                const otherTextSpan = otherButton.querySelector('.control-text');
                if (otherPlayIcon) otherPlayIcon.style.display = 'inline';
                if (otherPauseIcon) otherPauseIcon.style.display = 'none';
                if (otherTextSpan) otherTextSpan.textContent = ' Hear me bark!';
                otherButton.classList.remove('playing');
            }
        }
    });
    if (audioPlayer.paused || audioPlayer.ended) {
        audioPlayer.play().catch(error => console.error("Error playing audio:", error));
    } else {
        audioPlayer.pause();
    }
}

function scrollToBottom() {
    if (chatContainerElement) {
        chatContainerElement.scrollTop = chatContainerElement.scrollHeight;
    }
}