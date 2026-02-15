<script>
  import { onMount } from 'svelte';
  import { addEvent } from '../lib/supabase.js';
  import { transcribeWhisper } from '../lib/transcribe.js';
  import { createRecognition, isSupported } from '../lib/speech.js';
  import { getMyProfile } from '../lib/profiles.js';

  function logout() {
    window.location.href = '/noted/logout';
  }

  const APP_VERSION = 9;

  let text = $state('');
  let state = $state('idle'); // 'idle' | 'recording' | 'transcribing' | 'saving' | 'saved'
  let error = $state('');
  let cancelled = false;

  let isPremium = $state(false);

  // MediaRecorder for Whisper path
  let mediaRecorder = null;
  let audioChunks = [];
  let mediaStream = null;

  // Web Speech API for free path
  let recognition = null;

  // Load premium status then auto-start recording
  onMount(async () => {
    try {
      const profile = await getMyProfile();
      isPremium = profile?.is_premium ?? false;
    } catch {
      isPremium = false;
    }
    startRecording();
  });

  function startRecording() {
    error = '';
    text = '';
    cancelled = false;
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

  function cancelRecording() {
    cancelled = true;
    if (isPremium) {
      if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
      mediaRecorder?.stop();
    } else {
      recognition?.abort();
    }
    state = 'idle';
  }

  // --- Whisper path (premium) ---
  async function startMediaRecorder() {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];
      mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        mediaStream.getTracks().forEach((t) => t.stop());
        mediaStream = null;
        if (cancelled) return;
        state = 'transcribing';
        try {
          const blob = new Blob(audioChunks, { type: 'audio/webm' });
          const transcript = await transcribeWhisper(blob);
          text = transcript;
          state = 'idle';
        } catch (e) {
          error = `Transcription failed: ${e.message}`;
          state = 'idle';
        }
      };

      mediaRecorder.start();
      state = 'recording';
      history.pushState({ recording: true }, '');
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
      history.pushState({ recording: true }, '');
    }
  }

  // Handle back button to cancel recording
  $effect(() => {
    function onPopState() {
      if (state === 'recording') {
        cancelRecording();
      }
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  });

  async function forceUpdate() {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.unregister();
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    }
    location.reload();
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
  <button class="logout-btn" onclick={logout}>Logout</button>

  {#if state === 'saved'}
    <div class="saved-flash">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <p>Saved!</p>
    </div>
  {:else if state === 'transcribing'}
    <div class="transcribing-view">
      <div class="spinner-large"></div>
      <p class="mic-label">Transcribing...</p>
    </div>
  {:else}
    <div class="input-area">
      <input
        type="text"
        class="event-input"
        placeholder="Tap mic to dictate..."
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

    <button
      class="mic-btn"
      onclick={startRecording}
      disabled={state === 'saving'}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="1" width="6" height="12" rx="3"/>
        <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
        <line x1="12" y1="18" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    </button>

    <p class="hint">{isPremium ? 'Whisper' : 'Web Speech API'}</p>
  {/if}

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <div class="version-row">
    <button class="update-btn" onclick={forceUpdate}>Update</button>
    <span>v{APP_VERSION}</span>
  </div>
</div>

{#if state === 'recording'}
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-mic recording">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="1" width="6" height="12" rx="3"/>
          <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
          <line x1="12" y1="18" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </div>
      <p class="modal-label">Recording...</p>
      <div class="modal-buttons">
        <button class="modal-btn cancel" onclick={cancelRecording}>Cancel</button>
        <button class="modal-btn stop" onclick={stopRecording}>Stop</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .record-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: calc(100dvh - 64px);
    padding: 24px;
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

  .mic-btn {
    position: fixed;
    bottom: calc(64px + 15dvh);
    left: 50%;
    transform: translateX(-50%);
    width: 64px;
    height: 64px;
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
    width: 28px;
    height: 28px;
  }

  .mic-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .hint {
    position: fixed;
    bottom: calc(64px + 15dvh - 44px);
    left: 50%;
    transform: translateX(-50%);
    color: #8892b0;
    font-size: 13px;
  }

  /* Transcribing state */
  .transcribing-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .spinner-large {
    width: 48px;
    height: 48px;
    border: 4px solid #0f3460;
    border-top-color: #e94560;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* Recording modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    animation: fadeIn 0.2s ease;
  }

  .modal {
    background: #16213e;
    border-radius: 20px;
    padding: 32px 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    min-width: 240px;
  }

  .modal-mic {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 2px solid #e94560;
    color: #e94560;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .modal-mic svg {
    width: 32px;
    height: 32px;
  }

  .modal-label {
    color: #e0e0e0;
    font-size: 18px;
    font-weight: 500;
  }

  .modal-buttons {
    display: flex;
    gap: 12px;
    width: 100%;
  }

  .modal-btn {
    flex: 1;
    padding: 12px;
    border-radius: 10px;
    border: none;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .modal-btn.cancel {
    background: #0f3460;
    color: #8892b0;
  }

  .modal-btn.stop {
    background: #e94560;
    color: white;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(233, 69, 96, 0.4); }
    50% { box-shadow: 0 0 0 12px rgba(233, 69, 96, 0); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .mic-label {
    color: #8892b0;
    font-size: 14px;
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

  .version-row {
    position: fixed;
    bottom: 72px;
    right: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #5a6785;
    font-size: 11px;
  }

  .logout-btn {
    position: fixed;
    top: 12px;
    right: 12px;
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid #0f3460;
    background: transparent;
    color: #8892b0;
    font-size: 13px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    z-index: 10;
  }

  .update-btn {
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid #0f3460;
    background: transparent;
    color: #5a6785;
    font-size: 11px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
</style>
