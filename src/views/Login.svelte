<script>
  import { supabase } from '../lib/supabase.js';

  let email = $state('');
  let password = $state('');
  let isSignUp = $state(false);
  let loading = $state(false);
  let error = $state('');

  async function handleSubmit(e) {
    e.preventDefault();
    loading = true;
    error = '';

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      error = authError.message;
    } else if (isSignUp) {
      error = 'Check your email for a confirmation link.';
    }

    loading = false;
  }
</script>

<div class="login-container">
  <div class="login-header">
    <svg class="logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
    <h1>Noted.</h1>
    <p class="subtitle">{isSignUp ? 'Create an account' : 'Sign in to continue'}</p>
  </div>

  <form onsubmit={handleSubmit} autocomplete="on">
    <div class="field">
      <input
        type="email"
        name="email"
        autocomplete="username"
        placeholder="Email"
        bind:value={email}
        required
        disabled={loading}
      />
    </div>
    <div class="field">
      <input
        type="password"
        name="password"
        autocomplete={isSignUp ? 'new-password' : 'current-password'}
        placeholder="Password"
        bind:value={password}
        required
        disabled={loading}
        minlength="6"
      />
    </div>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <button type="submit" class="submit-btn" disabled={loading}>
      {loading ? '...' : isSignUp ? 'Sign Up' : 'Sign In'}
    </button>
  </form>

  <button class="toggle-btn" onclick={() => { isSignUp = !isSignUp; error = ''; }}>
    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
  </button>
</div>

<style>
  .login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
    padding: 24px;
  }

  .login-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .logo {
    width: 48px;
    height: 48px;
    color: #e94560;
    margin-bottom: 12px;
  }

  h1 {
    margin: 0;
    font-size: 24px;
    color: #e0e0e0;
  }

  .subtitle {
    margin: 8px 0 0;
    color: #8892b0;
    font-size: 14px;
  }

  form {
    width: 100%;
    max-width: 320px;
  }

  .field {
    margin-bottom: 12px;
  }

  input {
    width: 100%;
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid #0f3460;
    background: #16213e;
    color: #e0e0e0;
    font-size: 16px;
    outline: none;
    box-sizing: border-box;
  }

  input:focus {
    border-color: #e94560;
  }

  input::placeholder {
    color: #5a6785;
  }

  .error {
    color: #e94560;
    font-size: 13px;
    text-align: center;
    margin: 0 0 12px;
  }

  .submit-btn {
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

  .submit-btn:disabled {
    opacity: 0.6;
  }

  .toggle-btn {
    margin-top: 16px;
    background: none;
    border: none;
    color: #8892b0;
    font-size: 13px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
</style>
