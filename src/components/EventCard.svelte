<script>
  let { event, onUpdate, onDelete } = $props();

  let editing = $state(false);
  let editText = $state('');
  let showDeleteConfirm = $state(false);

  function startEdit() {
    editText = event.keywords;
    editing = true;
  }

  async function saveEdit() {
    if (editText.trim()) {
      await onUpdate(event.id, editText.trim());
      editing = false;
    }
  }

  function cancelEdit() {
    editing = false;
  }

  function confirmDelete() {
    showDeleteConfirm = true;
  }

  async function doDelete() {
    await onDelete(event.id);
    showDeleteConfirm = false;
  }

  function cancelDelete() {
    showDeleteConfirm = false;
  }

  function formatRelative(ts) {
    const now = Date.now();
    const diff = now - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  function formatExact(ts) {
    return new Date(ts).toLocaleString();
  }
</script>

<div class="card">
  {#if showDeleteConfirm}
    <div class="delete-confirm">
      <p>Delete this record?</p>
      <div class="confirm-buttons">
        <button class="btn btn-danger" onclick={doDelete}>Delete</button>
        <button class="btn btn-secondary" onclick={cancelDelete}>Cancel</button>
      </div>
    </div>
  {:else if editing}
    <div class="edit-form">
      <input
        type="text"
        class="edit-input"
        bind:value={editText}
        onkeydown={(e) => e.key === 'Enter' && saveEdit()}
      />
      <div class="edit-buttons">
        <button class="btn btn-primary" onclick={saveEdit}>Save</button>
        <button class="btn btn-secondary" onclick={cancelEdit}>Cancel</button>
      </div>
    </div>
  {:else}
    <div class="card-content">
      <div class="card-text">
        <span class="keywords">{event.keywords}</span>
        <span class="timestamp" title={formatExact(event.timestamp)}>
          {formatRelative(event.timestamp)}
          <span class="exact">{formatExact(event.timestamp)}</span>
        </span>
      </div>
      <div class="card-actions">
        <button class="icon-btn" onclick={startEdit} aria-label="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="icon-btn delete" onclick={confirmDelete} aria-label="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .card {
    background: #16213e;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 10px;
  }

  .card-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .card-text {
    flex: 1;
    min-width: 0;
  }

  .keywords {
    display: block;
    font-size: 16px;
    color: #e0e0e0;
    margin-bottom: 4px;
  }

  .timestamp {
    font-size: 13px;
    color: #8892b0;
  }

  .exact {
    display: block;
    font-size: 11px;
    color: #5a6785;
    margin-top: 2px;
  }

  .card-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: none;
    background: #0f3460;
    color: #8892b0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s;
    -webkit-tap-highlight-color: transparent;
  }

  .icon-btn:active {
    background: #1a4a7a;
  }

  .icon-btn.delete:active {
    background: #5c1a2a;
    color: #e94560;
  }

  .icon-btn svg {
    width: 18px;
    height: 18px;
  }

  .delete-confirm {
    text-align: center;
  }

  .delete-confirm p {
    margin: 0 0 12px;
    color: #e0e0e0;
  }

  .confirm-buttons, .edit-buttons {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .edit-input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #0f3460;
    background: #0a0f1e;
    color: #e0e0e0;
    font-size: 16px;
    outline: none;
    box-sizing: border-box;
  }

  .edit-input:focus {
    border-color: #e94560;
  }

  .btn {
    padding: 8px 20px;
    border-radius: 8px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .btn-primary {
    background: #e94560;
    color: white;
  }

  .btn-secondary {
    background: #0f3460;
    color: #8892b0;
  }

  .btn-danger {
    background: #e94560;
    color: white;
  }
</style>
