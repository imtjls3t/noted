<script>
  import { supabase } from './lib/supabase.js';
  import { listProfiles, togglePremium, deleteUser } from './lib/profiles.js';

  const ADMIN_EMAIL = 'usual-polo-uphill@duck.com';

  let session = $state(null);
  let loading = $state(true);
  let denied = $state(false);

  let profiles = $state([]);
  let profilesLoading = $state(false);
  let error = $state('');

  // Auth form
  let email = $state('');
  let password = $state('');
  let authError = $state('');
  let authLoading = $state(false);

  $effect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      session = s;
      loading = false;
      checkAccess(s);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      session = s;
      checkAccess(s);
    });

    return () => subscription.unsubscribe();
  });

  function checkAccess(s) {
    if (s && s.user?.email !== ADMIN_EMAIL) {
      denied = true;
      supabase.auth.signOut();
    } else if (s && s.user?.email === ADMIN_EMAIL) {
      denied = false;
      loadProfiles();
    }
  }

  async function login() {
    authError = '';
    authLoading = true;
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) authError = err.message;
    authLoading = false;
  }

  async function loadProfiles() {
    profilesLoading = true;
    error = '';
    try {
      profiles = await listProfiles();
    } catch (e) {
      error = e.message;
    }
    profilesLoading = false;
  }

  async function handleToggle(profile) {
    error = '';
    try {
      const updated = await togglePremium(profile.id, !profile.is_premium);
      profiles = profiles.map(p => p.id === updated.id ? updated : p);
    } catch (e) {
      error = e.message;
    }
  }

  let confirmDelete = $state(null);

  function promptDelete(profile) {
    confirmDelete = profile;
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    error = '';
    try {
      await deleteUser(confirmDelete.id);
      profiles = profiles.filter(p => p.id !== confirmDelete.id);
    } catch (e) {
      error = e.message;
    }
    confirmDelete = null;
  }

  async function logout() {
    await supabase.auth.signOut();
  }
</script>

{#if loading}
  <div class="center">
    <div class="spinner"></div>
  </div>
{:else if denied}
  <div class="center">
    <p class="denied">Access denied</p>
    <p class="denied-sub">Admin only.</p>
  </div>
{:else if !session}
  <div class="center">
    <h1 class="title">Admin Panel</h1>
    <form class="login-form" onsubmit={(e) => { e.preventDefault(); login(); }}>
      <input type="email" placeholder="Email" bind:value={email} />
      <input type="password" placeholder="Password" bind:value={password} />
      <button type="submit" disabled={authLoading}>
        {authLoading ? 'Signing in...' : 'Sign in'}
      </button>
      {#if authError}
        <p class="error">{authError}</p>
      {/if}
    </form>
  </div>
{:else}
  <div class="admin">
    <header>
      <h1>Admin Panel</h1>
      <button class="logout-btn" onclick={logout}>Logout</button>
    </header>

    {#if profilesLoading}
      <div class="center"><div class="spinner"></div></div>
    {:else}
      <ul class="user-list">
        {#each profiles as profile}
          <li class="user-row">
            <span class="user-email">{profile.email}</span>
            <div class="row-actions">
              <button
                class="toggle-btn"
                class:active={profile.is_premium}
                onclick={() => handleToggle(profile)}
              >
                {profile.is_premium ? 'Premium' : 'Free'}
              </button>
              <button class="delete-btn" onclick={() => promptDelete(profile)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/>
                  <path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}

    {#if error}
      <p class="error">{error}</p>
    {/if}
  </div>

  {#if confirmDelete}
    <div class="modal-overlay">
      <div class="modal">
        <p class="modal-text">Delete user {confirmDelete.email}?</p>
        <div class="modal-buttons">
          <button class="modal-btn no" onclick={() => confirmDelete = null}>No</button>
          <button class="modal-btn yes" onclick={handleDelete}>Yes</button>
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  .center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
    padding: 24px;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #0f3460;
    border-top-color: #e94560;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .title {
    color: #e0e0e0;
    font-size: 24px;
    margin-bottom: 24px;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 320px;
  }

  .login-form input {
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid #0f3460;
    background: #16213e;
    color: #e0e0e0;
    font-size: 16px;
    outline: none;
  }

  .login-form input:focus {
    border-color: #e94560;
  }

  .login-form button {
    padding: 14px;
    border-radius: 10px;
    border: none;
    background: #e94560;
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
  }

  .login-form button:disabled {
    opacity: 0.5;
  }

  .denied {
    color: #e94560;
    font-size: 24px;
    font-weight: 600;
  }

  .denied-sub {
    color: #8892b0;
    margin-top: 8px;
  }

  .admin {
    max-width: 480px;
    margin: 0 auto;
    padding: 24px 16px;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  header h1 {
    color: #e0e0e0;
    font-size: 24px;
  }

  .logout-btn {
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid #0f3460;
    background: transparent;
    color: #8892b0;
    font-size: 14px;
    cursor: pointer;
  }

  .user-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .user-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    background: #16213e;
    border-radius: 10px;
    border: 1px solid #0f3460;
  }

  .user-email {
    color: #e0e0e0;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-right: 12px;
  }

  .toggle-btn {
    padding: 6px 14px;
    border-radius: 6px;
    border: none;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    background: #0f3460;
    color: #8892b0;
  }

  .toggle-btn.active {
    background: #e94560;
    color: white;
  }

  .row-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .delete-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: #8892b0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .delete-btn svg {
    width: 16px;
    height: 16px;
  }

  .delete-btn:hover {
    color: #e94560;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal {
    background: #16213e;
    border-radius: 16px;
    padding: 24px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    min-width: 260px;
  }

  .modal-text {
    color: #e0e0e0;
    font-size: 15px;
    text-align: center;
    word-break: break-all;
  }

  .modal-buttons {
    display: flex;
    gap: 12px;
    width: 100%;
  }

  .modal-btn {
    flex: 1;
    padding: 10px;
    border-radius: 8px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .modal-btn.no {
    background: #0f3460;
    color: #8892b0;
  }

  .modal-btn.yes {
    background: #e94560;
    color: white;
  }

  .error {
    color: #e94560;
    font-size: 13px;
    margin-top: 12px;
    text-align: center;
  }
</style>
