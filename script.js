let isRecording = false;
let startTime;
let timerInterval;
let wordCount = 0;
let promptCount = 0;
let finalTranscript = '';
let latestResponse = '';

const recordBtn = document.getElementById('record-btn');
const speakBtn = document.getElementById('speak-btn');
const demoBtn = document.getElementById('demo-btn');
const statusDiv = document.getElementById('status');
const timeSpentSpan = document.getElementById('time-spent');
const wordCountSpan = document.getElementById('word-count');
const promptCountSpan = document.getElementById('prompt-count');
const duckElement = document.getElementById('duck');
const transcriptEl = document.getElementById('transcript');
const responseEl = document.getElementById('llm-response');
const apiUrlEl = document.getElementById('api-url');
const apiKeyEl = document.getElementById('api-key');
const apiModelEl = document.getElementById('api-model');
const feedbackPositiveBtn = document.getElementById('feedback-positive');
const feedbackNegativeBtn = document.getElementById('feedback-negative');
const feedbackText = document.getElementById('feedback-text');
const feedbackSendBtn = document.getElementById('feedback-send');

const recognition = setupSpeechRecognition();
const coachProfile = loadCoachProfile();
loadSettings();

let frame = 0;
setInterval(() => {
    duckElement.classList.remove('idle-frame-1', 'idle-frame-2');
    frame = (frame + 1) % 3;
    if (frame > 0) {
        duckElement.classList.add(`idle-frame-${frame}`);
    }
}, 1000);

recordBtn.addEventListener('click', () => {
    if (!recognition) {
        statusDiv.textContent = 'Speech recognition unsupported here. Use Try Demo.';
        return;
    }

    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
});

speakBtn.addEventListener('click', () => {
    if (!latestResponse) {
        statusDiv.textContent = 'No reply yet. Try Demo or record first.';
        return;
    }
    speakText(latestResponse);
});

demoBtn.addEventListener('click', runDemoSession);
feedbackPositiveBtn.addEventListener('click', () => saveFeedback('positive'));
feedbackNegativeBtn.addEventListener('click', () => saveFeedback('negative'));
feedbackSendBtn.addEventListener('click', () => {
    const typedFeedback = feedbackText.value.trim();
    if (!typedFeedback) {
        return;
    }
    saveFeedback('text', typedFeedback);
    feedbackText.value = '';
});

[apiUrlEl, apiKeyEl, apiModelEl].forEach((el) => {
    el.addEventListener('change', persistSettings);
});

function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        return null;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += `${transcript} `;
            } else {
                interimTranscript += transcript;
            }
        }
        transcriptEl.textContent = `${finalTranscript}${interimTranscript}`.trim() || 'Listening...';
    };

    recognitionInstance.onerror = () => {
        statusDiv.textContent = 'Recognition error. Try Demo or try mic again.';
    };

    return recognitionInstance;
}

function startRecording() {
    isRecording = true;
    finalTranscript = '';
    transcriptEl.textContent = 'Listening...';
    recordBtn.textContent = 'Stop Read Aloud';
    recordBtn.classList.add('recording');
    statusDiv.textContent = 'Crow is listening...';

    startTime = Date.now();
    timerInterval = setInterval(updateStats, 1000);
    recognition.start();
}

async function stopRecording() {
    if (!isRecording) {
        return;
    }
    isRecording = false;
    recognition.stop();

    recordBtn.textContent = 'Start Read Aloud';
    recordBtn.classList.remove('recording');
    statusDiv.textContent = 'Thinking...';
    clearInterval(timerInterval);

    const spokenText = finalTranscript.trim();
    if (!spokenText) {
        statusDiv.textContent = 'Idle';
        responseEl.textContent = 'No speech detected. Please try again.';
        return;
    }

    promptCount += 1;
    promptCountSpan.textContent = promptCount;

    const reply = await generateCoachReply(spokenText);
    latestResponse = reply;
    responseEl.textContent = reply;
    statusDiv.textContent = 'Idle';
    speakText(reply);
}

function runDemoSession() {
    finalTranscript = 'I finally shipped the feature and fixed two bugs.';
    transcriptEl.textContent = finalTranscript;
    promptCount += 1;
    promptCountSpan.textContent = promptCount;
    const sarcasmLevel = computeSarcasmLevel();
    const reply = localHeuristicReply(finalTranscript, sarcasmLevel);
    latestResponse = reply;
    responseEl.textContent = reply;
    statusDiv.textContent = 'Demo complete. Now try recording with your mic.';
    speakText(reply);
}

function speakText(text) {
    if (!window.speechSynthesis || !text) {
        return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 0.95;
    speechSynthesis.speak(utterance);
}

function updateStats() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    timeSpentSpan.textContent = elapsed;
    wordCount = Math.floor(elapsed * 2.1);
    wordCountSpan.textContent = wordCount;
}

function saveFeedback(type, content = '') {
    if (type === 'positive') {
        coachProfile.positive += 1;
    }
    if (type === 'negative') {
        coachProfile.negative += 1;
    }
    if (type === 'text') {
        coachProfile.notes.push(content.slice(0, 140));
        coachProfile.notes = coachProfile.notes.slice(-10);
    }
    localStorage.setItem('coachProfile', JSON.stringify(coachProfile));
    statusDiv.textContent = 'Feedback saved. Crow is "learning."';
}

async function generateCoachReply(userText) {
    const apiUrl = apiUrlEl.value.trim();
    const apiKey = apiKeyEl.value.trim();
    const model = apiModelEl.value.trim() || 'gpt-4o-mini';

    const sarcasmLevel = computeSarcasmLevel();
    const notes = coachProfile.notes.length ? coachProfile.notes.join(' | ') : 'none';

    const systemPrompt = [
        'You are a concise coach with slightly sarcastic, slightly negative reinforcement.',
        'Keep replies to 1-2 sentences max.',
        'If user shares success/positive intent, include a begrudging compliment like "fine, that is pretty good".',
        'Do not insult protected traits or use abusive language.',
        `Sarcasm intensity target: ${sarcasmLevel}/10.`,
        `User feedback notes: ${notes}.`
    ].join(' ');

    if (!apiUrl || !apiKey) {
        return localHeuristicReply(userText, sarcasmLevel);
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                temperature: 0.7,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userText }
                ]
            })
        });

        if (!response.ok) {
            return `Your API call failed (${response.status}). Amazing start. ${localHeuristicReply(userText, sarcasmLevel)}`;
        }

        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        return text || localHeuristicReply(userText, sarcasmLevel);
    } catch (error) {
        console.error('LLM API error:', error);
        return `Could not reach the API. Stunning reliability. ${localHeuristicReply(userText, sarcasmLevel)}`;
    }
}

function localHeuristicReply(userText, sarcasmLevel) {
    const positiveWords = ['good', 'great', 'shipped', 'done', 'success', 'won', 'improved'];
    const lower = userText.toLowerCase();
    const positive = positiveWords.some((word) => lower.includes(word));
    const jab = sarcasmLevel > 6 ? 'Try not to celebrate too soon.' : 'Keep going, I guess.';

    if (positive) {
        return `Fine, that is a pretty good idea. ${jab}`;
    }
    return `Interesting attempt. ${jab} Maybe be more specific next time.`;
}

function computeSarcasmLevel() {
    const total = coachProfile.positive + coachProfile.negative;
    if (total === 0) {
        return 6;
    }
    const ratio = coachProfile.negative / total;
    return Math.max(2, Math.min(8, Math.round(4 + ratio * 4)));
}

function loadCoachProfile() {
    const saved = localStorage.getItem('coachProfile');
    if (!saved) {
        return { positive: 0, negative: 0, notes: [] };
    }

    try {
        const parsed = JSON.parse(saved);
        return {
            positive: Number(parsed.positive) || 0,
            negative: Number(parsed.negative) || 0,
            notes: Array.isArray(parsed.notes) ? parsed.notes : []
        };
    } catch {
        return { positive: 0, negative: 0, notes: [] };
    }
}

function persistSettings() {
    localStorage.setItem('llmSettings', JSON.stringify({
        apiUrl: apiUrlEl.value,
        apiKey: apiKeyEl.value,
        apiModel: apiModelEl.value
    }));
}

function loadSettings() {
    const raw = localStorage.getItem('llmSettings');
    if (!raw) {
        return;
    }
    try {
        const settings = JSON.parse(raw);
        apiUrlEl.value = settings.apiUrl || '';
        apiKeyEl.value = settings.apiKey || '';
        apiModelEl.value = settings.apiModel || 'gpt-4o-mini';
    } catch {
        // ignore malformed settings
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        recordBtn.click();
    }
});
