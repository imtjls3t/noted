<script>
  import { searchEvents, updateEvent, deleteEvent } from '../lib/supabase.js';
  import EventCard from '../components/EventCard.svelte';

  let query = $state('');
  let results = $state([]);
  let loading = $state(false);
  let error = $state('');
  let searchTimeout = null;

  $effect(() => {
    // Debounce search as user types
    clearTimeout(searchTimeout);
    const q = query;
    searchTimeout = setTimeout(() => doSearch(q), 300);
    return () => clearTimeout(searchTimeout);
  });

  async function doSearch(q) {
    loading = true;
    error = '';
    try {
      results = await searchEvents(q);
    } catch (e) {
      error = e.message;
    }
    loading = false;
  }

  async function handleUpdate(id, keywords) {
    try {
      await updateEvent(id, keywords);
      results = results.map((r) => (r.id === id ? { ...r, keywords } : r));
    } catch (e) {
      error = e.message;
    }
  }

  async function handleDelete(id) {
    try {
      await deleteEvent(id);
      results = results.filter((r) => r.id !== id);
    } catch (e) {
      error = e.message;
    }
  }
</script>

<div class="search-view">
  <div class="search-bar">
    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <input
      type="text"
      class="search-input"
      placeholder="Search events..."
      bind:value={query}
    />
  </div>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <div class="results">
    {#if loading && results.length === 0}
      <p class="status">Loading...</p>
    {:else if results.length === 0}
      <p class="status">{query ? 'No results found' : 'No events yet'}</p>
    {:else}
      {#each results as event (event.id)}
        <EventCard {event} onUpdate={handleUpdate} onDelete={handleDelete} />
      {/each}
    {/if}
  </div>
</div>

<style>
  .search-view {
    padding: 16px;
    padding-bottom: 80px;
    min-height: calc(100dvh - 64px);
  }

  .search-bar {
    position: relative;
    margin-bottom: 16px;
  }

  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: #5a6785;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 14px 14px 14px 44px;
    border-radius: 12px;
    border: 1px solid #0f3460;
    background: #16213e;
    color: #e0e0e0;
    font-size: 16px;
    outline: none;
    box-sizing: border-box;
  }

  .search-input:focus {
    border-color: #e94560;
  }

  .search-input::placeholder {
    color: #5a6785;
  }

  .error {
    color: #e94560;
    font-size: 13px;
    text-align: center;
    margin-bottom: 12px;
  }

  .status {
    text-align: center;
    color: #5a6785;
    margin-top: 48px;
    font-size: 14px;
  }
</style>
