let isRecording = false;
let startTime;
let timerInterval;
let wordCount = 0;
let mediaRecorder;
let audioChunks = [];

const recordBtn = document.getElementById('record-btn');
const statusDiv = document.getElementById('status');
const timeSpentSpan = document.getElementById('time-spent');
const wordCountSpan = document.getElementById('word-count');
const duckElement = document.getElementById('duck');

// Idle Animation
let frame = 0;
setInterval(() => {
    duckElement.classList.remove('idle-frame-1', 'idle-frame-2');
    frame = (frame + 1) % 3;
    if (frame > 0) {
        duckElement.classList.add(`idle-frame-${frame}`);
    }
}, 1000);

recordBtn.addEventListener('click', async () => {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
});

let audioStream;

async function startRecording() {
    try {
        if (!audioStream) {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        mediaRecorder = new MediaRecorder(audioStream);
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            audioChunks = [];
        };

        mediaRecorder.start();
        
        isRecording = true;
        recordBtn.textContent = 'Stop Debugging';
        recordBtn.classList.add('recording');
        statusDiv.textContent = 'Crow is listening...';
        
        startTime = Date.now();
        timerInterval = setInterval(updateStats, 1000);
    } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Could not access microphone. Please ensure you have given permission.');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        // We no longer stop the tracks here to prevent repetitive permission prompts.
        // The microphone remains active (indicated by the browser icon), but we stop recording.
    }
    
    isRecording = false;
    recordBtn.textContent = 'Start Debugging';
    recordBtn.classList.remove('recording');
    statusDiv.textContent = 'Idle';
    
    clearInterval(timerInterval);
}



function updateStats() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    timeSpentSpan.textContent = elapsed;
    
    // Very simple "word count" heuristic: 
    // Assuming roughly 2.1 words per second while talking.
    wordCount = Math.floor(elapsed * 2.1); 
    wordCountSpan.textContent = wordCount;

    // Beak animation removed as per "first sprint" requirements
}


// Add Keyboard Support
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        recordBtn.click();
    }
});
