<script>
  let { activeTab = 'record', onTabChange } = $props();
</script>

<nav class="tab-bar">
  <button
    class="tab"
    class:active={activeTab === 'record'}
    onclick={() => onTabChange('record')}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
    <span>Record</span>
  </button>
  <button
    class="tab"
    class:active={activeTab === 'search'}
    onclick={() => onTabChange('search')}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <span>Search</span>
  </button>
</nav>

<style>
  .tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    background: #16213e;
    border-top: 1px solid #0f3460;
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 100;
  }

  .tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 0;
    background: none;
    border: none;
    color: #8892b0;
    font-size: 11px;
    cursor: pointer;
    transition: color 0.2s;
    -webkit-tap-highlight-color: transparent;
  }

  .tab.active {
    color: #e94560;
  }

  .tab svg {
    width: 24px;
    height: 24px;
  }
</style>
