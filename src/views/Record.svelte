<script>
  import { addEvent } from '../lib/supabase.js';
  import { transcribeWhisper } from '../lib/transcribe.js';
  import { createRecognition, isSupported } from '../lib/speech.js';

  const PREMIUM_EMAIL = 'usual-polo-uphill@duck.com';

  let { userEmail } = $props();

  let text = $state('');
  let state = $state('idle'); // 'idle' | 'recording' | 'transcribing' | 'saving' | 'saved'
  let error = $state('');

  let isPremium = $derived(userEmail === PREMIUM_EMAIL);

  // MediaRecorder for Whisper path
  let mediaRecorder = null;
  let audioChunks = [];

  // Web Speech API for free path
  let recognition = null;

  function toggleRecording() {
    if (state === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function startRecording() {
    error = '';
    if (isPremium) {
      startMediaRecorder();
    } else {
      startWebSpeech();
    }
  }

  function stopRecording() {
    if (isPremium) {
      mediaRecorder?.stop();
    } else {
      recognition?.stop();
    }
  }

  // --- Whisper path (premium) ---
  async function startMediaRecorder() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        state = 'transcribing';
        try {
          const blob = new Blob(audioChunks, { type: 'audio/webm' });
          const transcript = await transcribeWhisper(blob);
          text = text ? `${text} ${transcript}` : transcript;
          state = 'idle';
        } catch (e) {
          error = `Transcription failed: ${e.message}`;
          state = 'idle';
        }
      };

      mediaRecorder.start();
      state = 'recording';
    } catch (e) {
      error = `Mic access denied: ${e.message}`;
    }
  }

  // --- Web Speech API path (free) ---
  function startWebSpeech() {
    if (!isSupported()) {
      error = 'Speech recognition not supported in this browser';
      return;
    }

    recognition = createRecognition({
      onResult(transcript) {
        text = transcript;
      },
      onEnd() {
        recognition = null;
        if (state === 'recording') state = 'idle';
      },
      onError(err) {
        error = `Speech error: ${err}`;
        state = 'idle';
      },
    });

    if (recognition) {
      recognition.start();
      state = 'recording';
    }
  }

  async function save() {
    if (!text.trim()) return;
    state = 'saving';
    error = '';
    try {
      await addEvent(text.trim());
      state = 'saved';
      text = '';
      setTimeout(() => { state = 'idle'; }, 1200);
    } catch (e) {
      error = `Save failed: ${e.message}`;
      state = 'idle';
    }
  }
</script>

<div class="record-view">
  {#if state === 'saved'}
    <div class="saved-flash">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <p>Saved!</p>
    </div>
  {:else}
    <button
      class="mic-btn"
      class:recording={state === 'recording'}
      class:transcribing={state === 'transcribing'}
      onclick={toggleRecording}
      disabled={state === 'transcribing' || state === 'saving'}
    >
      {#if state === 'transcribing'}
        <div class="spinner"></div>
      {:else}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="1" width="6" height="12" rx="3"/>
          <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
          <line x1="12" y1="18" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      {/if}
    </button>

    <p class="mic-label">
      {#if state === 'recording'}
        Tap to stop
      {:else if state === 'transcribing'}
        Transcribing...
      {:else}
        Tap to speak
      {/if}
    </p>

    <div class="input-area">
      <input
        type="text"
        class="event-input"
        placeholder="Or type here..."
        bind:value={text}
        onkeydown={(e) => e.key === 'Enter' && save()}
        enterkeyhint="done"
      />
      <button
        class="save-btn"
        onclick={save}
        disabled={!text.trim() || state === 'saving'}
      >
        {state === 'saving' ? '...' : 'Save'}
      </button>
    </div>

    <p class="hint">{isPremium ? 'Whisper transcription' : 'Web Speech API'}</p>
  {/if}

  {#if error}
    <p class="error">{error}</p>
  {/if}
</div>

<style>
  .record-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: calc(100dvh - 64px);
    padding: 24px;
  }

  .mic-btn {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 2px solid #0f3460;
    background: #16213e;
    color: #8892b0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;
    transition: all 0.2s ease;
  }

  .mic-btn svg {
    width: 32px;
    height: 32px;
  }

  .mic-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .mic-btn.recording {
    border-color: #e94560;
    color: #e94560;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .mic-btn .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #0f3460;
    border-top-color: #e94560;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(233, 69, 96, 0.4); }
    50% { box-shadow: 0 0 0 12px rgba(233, 69, 96, 0); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .mic-label {
    margin-top: 12px;
    margin-bottom: 24px;
    color: #8892b0;
    font-size: 14px;
  }

  .input-area {
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .event-input {
    width: 100%;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid #0f3460;
    background: #16213e;
    color: #e0e0e0;
    font-size: 18px;
    text-align: center;
    outline: none;
    box-sizing: border-box;
  }

  .event-input:focus {
    border-color: #e94560;
  }

  .event-input::placeholder {
    color: #5a6785;
  }

  .save-btn {
    width: 100%;
    padding: 14px;
    border-radius: 10px;
    border: none;
    background: #e94560;
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .save-btn:disabled {
    opacity: 0.4;
  }

  .hint {
    margin-top: 16px;
    color: #8892b0;
    font-size: 13px;
  }

  .saved-flash {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #4ecdc4;
    animation: fadeIn 0.3s ease;
  }

  .saved-flash svg {
    width: 64px;
    height: 64px;
  }

  .saved-flash p {
    font-size: 20px;
    font-weight: 600;
    margin-top: 8px;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }

  .error {
    color: #e94560;
    font-size: 13px;
    margin-top: 12px;
    text-align: center;
  }
</style>
