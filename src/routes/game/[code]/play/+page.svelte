<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const { game, players, me, isCreator } = $derived(data);

  const hiders  = $derived(players.filter((p: any) => p.role === 'hider'));
  const seekers = $derived(players.filter((p: any) => p.role === 'seeker'));
  const found   = $derived(hiders.filter((p: any) => p.found_at));

  // Role reveal — 5-second countdown, tap to skip
  let revealed = $state(false);
  let countdown = $state(5);
  let countdownInterval: ReturnType<typeof setInterval>;

  // Found notification — triggered when polling detects remote mark
  let initiallyFound = false;
  let justFound = $state(false);

  let pollInterval: ReturnType<typeof setInterval>;

  onMount(() => {
    initiallyFound = !!me?.found_at;

    countdownInterval = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        revealed = true;
      }
    }, 1000);

    // Poll for status updates so hiders learn when they're found
    pollInterval = setInterval(() => invalidateAll(), 5000);
  });

  onDestroy(() => {
    clearInterval(countdownInterval);
    clearInterval(pollInterval);
  });

  $effect(() => {
    if (revealed && me?.found_at && !initiallyFound && !justFound) {
      justFound = true;
    }
  });

  function skipReveal() {
    clearInterval(countdownInterval);
    revealed = true;
  }

  // Mark-found modal
  let markingPlayer: any = $state(null);
</script>

{#if !revealed}
  <!-- Dramatic role reveal with countdown -->
  <div
    role="button"
    tabindex="0"
    onclick={skipReveal}
    onkeydown={(e) => e.key === 'Enter' && skipReveal()}
    style="
      position:fixed; inset:0;
      background:{me?.role === 'seeker' ? '#1a0008' : '#001a00'};
      display:flex; align-items:center; justify-content:center;
      flex-direction:column; gap:1.5rem; z-index:100; cursor:pointer;
    "
  >
    <p class="muted" style="text-transform:uppercase; letter-spacing:4px; font-size:0.8rem;">you are a...</p>
    <h1 class="glitch" data-text={me?.role?.toUpperCase() ?? '?'}
      style="font-size:clamp(4rem,18vw,9rem); color:{me?.role === 'seeker' ? 'var(--danger)' : 'var(--accent)'}; line-height:1;">
      {me?.role?.toUpperCase() ?? '?'}
    </h1>
    {#if me?.role === 'seeker'}
      <p style="color:var(--danger); font-size:1.1rem; font-weight:700;">Find them all.</p>
    {:else}
      <p style="color:var(--accent); font-size:1.1rem; font-weight:700;">Don't get caught.</p>
    {/if}
    <div style="margin-top:1rem; display:flex; flex-direction:column; align-items:center; gap:0.5rem;">
      <p style="font-size:3rem; font-weight:900; color:var(--fg);">{countdown}</p>
      <p class="muted" style="font-size:0.75rem; letter-spacing:2px;">TAP TO CONTINUE</p>
    </div>
  </div>
{:else}

  <!-- "You've been found" notification overlay -->
  {#if justFound}
    <div
      role="button"
      tabindex="0"
      onclick={() => justFound = false}
      onkeydown={(e) => e.key === 'Enter' && (justFound = false)}
      style="
        position:fixed; inset:0;
        background:rgba(20,0,0,0.96);
        display:flex; align-items:center; justify-content:center;
        flex-direction:column; gap:1.5rem; z-index:100; cursor:pointer;
      "
    >
      <p class="muted" style="text-transform:uppercase; letter-spacing:4px; font-size:0.8rem;">oh no...</p>
      <h1 class="glitch" data-text="FOUND!" style="font-size:clamp(4rem,18vw,8rem); color:var(--danger); line-height:1;">FOUND!</h1>
      <p style="color:var(--fg); font-size:1.2rem; font-weight:700;">
        by <span style="color:var(--danger);">{me?.found_by}</span>
      </p>
      <p class="muted" style="font-size:0.75rem; letter-spacing:2px; margin-top:0.5rem;">TAP TO CONTINUE</p>
    </div>
  {/if}

  <!-- Mark-found modal -->
  {#if markingPlayer}
    <div style="
      position:fixed; inset:0; background:rgba(0,0,0,0.85);
      display:flex; align-items:center; justify-content:center; z-index:50; padding:1rem;
    ">
      <form method="POST" action="?/markFound"
        class="card stack" style="width:100%; max-width:400px;"
        onsubmit={() => setTimeout(() => markingPlayer = null, 100)}>
        <h3>Mark <span style="color:var(--accent)">{markingPlayer.name}</span> as found</h3>
        <input type="hidden" name="playerId" value={markingPlayer.id} />
        <div>
          <label for="found-by">Found by</label>
          <select id="found-by" name="foundBy" required>
            {#each seekers as s}
              <option value={s.name}>{s.name}</option>
            {/each}
          </select>
        </div>
        {#if (form as any)?.error}
          <p class="badge badge-pink">{(form as any).error}</p>
        {/if}
        <div class="row">
          <button type="button" class="btn" style="flex:1;" onclick={() => markingPlayer = null}>Cancel</button>
          <button type="submit" class="btn btn-danger" style="flex:1;">Confirm Found</button>
        </div>
      </form>
    </div>
  {/if}

  <div class="container reveal">
    <!-- Header -->
    <div class="row" style="margin-bottom:2rem; flex-wrap:wrap; gap:0.75rem;">
      <div class="stack" style="gap:0.25rem;">
        <h2>{game.id}</h2>
        {#if me}
          <span class="badge" class:badge-green={me.role === 'hider'} class:badge-pink={me.role === 'seeker'}>
            You: {me.role}
          </span>
        {/if}
      </div>
      <div class="spacer"></div>
      <div class="row" style="gap:0.5rem;">
        <button class="btn" onclick={() => invalidateAll()}>↻ Refresh</button>
        {#if isCreator}
          <form method="POST" action="?/endGame">
            <button type="submit" class="btn btn-danger">End Game</button>
          </form>
        {/if}
      </div>
    </div>

    <!-- Score bar -->
    <div class="card center" style="margin-bottom:1.5rem; padding:1rem;">
      <p style="font-size:2rem; font-weight:900;">
        <span style="color:var(--danger)">{found.length}</span>
        <span class="muted"> / </span>
        <span style="color:var(--accent)">{hiders.length}</span>
      </p>
      <p class="muted">hiders found</p>
    </div>

    <!-- My status (hider view) -->
    {#if me?.role === 'hider'}
      <div class="card stack" style="margin-bottom:1.5rem; border-color:{me.found_at ? 'var(--danger)' : 'var(--accent)'};">
        {#if me.found_at}
          <p style="color:var(--danger); font-weight:700;">🚨 You were found by {me.found_by}</p>
        {:else}
          <p style="color:var(--accent); font-weight:700;">🟢 You're still hiding!</p>
          <button class="btn btn-danger"
            onclick={() => { markingPlayer = me; }}>
            I've been found
          </button>
        {/if}
      </div>
    {/if}

    <!-- Seekers -->
    <div class="card stack" style="margin-bottom:1.5rem; gap:0;">
      <h3 style="margin-bottom:0.75rem;">🔍 Seekers ({seekers.length})</h3>
      {#each seekers as s}
        <div class="player-row">
          <span class="player-name">{s.name}</span>
          <span class="muted" style="font-size:0.8rem;">
            found {players.filter((p: any) => p.found_by === s.name).length}
          </span>
        </div>
      {/each}
    </div>

    <!-- Hiders -->
    <div class="card stack" style="gap:0;">
      <h3 style="margin-bottom:0.75rem;">🫣 Hiders ({hiders.length})</h3>
      {#each hiders as h}
        <div class="player-row">
          <div class="row" style="gap:0.5rem; flex:1;">
            <span class="player-name" class:player-found={!!h.found_at}>{h.name}</span>
            {#if h.found_at}
              <span class="badge badge-pink">found by {h.found_by}</span>
            {:else}
              <span class="badge badge-green">hiding</span>
            {/if}
          </div>
          {#if me?.role === 'seeker' && !h.found_at}
            <button class="btn" style="padding:0.35rem 0.75rem; font-size:0.8rem;"
              onclick={() => { markingPlayer = h; }}>
              Found
            </button>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
