<script>
  import { addEvent } from '../lib/supabase.js';

  let text = $state('');
  let state = $state('idle'); // 'idle' | 'saving' | 'saved'
  let error = $state('');

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
    <div class="input-area">
      <input
        type="text"
        class="event-input"
        placeholder="Tap mic on keyboard to dictate..."
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
    <p class="hint">Use your keyboard's mic button to dictate</p>
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
