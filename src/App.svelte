<script>
  import { supabase } from './lib/supabase.js';
  import Login from './views/Login.svelte';
  import Record from './views/Record.svelte';
  import Search from './views/Search.svelte';
  import TabBar from './components/TabBar.svelte';

  let session = $state(null);
  let loading = $state(true);
  let activeTab = $state('record');

  $effect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      session = s;
      loading = false;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      session = s;
    });

    return () => subscription.unsubscribe();
  });
</script>

{#if loading}
  <div class="loading">
    <div class="spinner"></div>
  </div>
{:else if !session}
  <Login />
{:else}
  <main class="app">
    {#if activeTab === 'record'}
      <Record />
    {:else}
      <Search />
    {/if}
    <TabBar {activeTab} onTabChange={(tab) => activeTab = tab} />
  </main>
{/if}

<style>
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
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

  .app {
    min-height: 100dvh;
  }
</style>
