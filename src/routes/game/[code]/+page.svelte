<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData, ActionData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();

  const { game, players, suggested, isCreator } = $derived(data);
  let seekerCount = $state(data.game.seeker_count);
  $effect(() => { seekerCount = data.game.seeker_count; });

  // Non-creator players poll every 3s so they auto-redirect when the game starts
  let poll: ReturnType<typeof setInterval>;
  onMount(() => {
    if (!isCreator) {
      poll = setInterval(async () => {
        const res = await fetch(`/api/game/${game.id}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.game?.status === 'active') goto(`/game/${game.id}/play`);
      }, 3000);
    }
  });
  onDestroy(() => clearInterval(poll));
</script>

<div class="container">
  <div class="row" style="margin-bottom:2.5rem; align-items:flex-start;">
    <div class="stack" style="gap:0.25rem;">
      <h1>{game.id}</h1>
      <span class="badge badge-yellow">Waiting for players</span>
    </div>
    <div class="spacer"></div>
    <a href="/" class="btn btn-ghost">← Back</a>
  </div>

  <!-- Share code -->
  <div class="card center stack" style="margin-bottom:1.5rem; gap:0.5rem;">
    <p class="muted" style="text-transform:uppercase; letter-spacing:2px; font-size:0.75rem;">Share this code</p>
    <p style="font-size:2.5rem; font-weight:900; letter-spacing:4px; color:var(--accent);">{game.id}</p>
    <p class="muted">{players.length} player{players.length !== 1 ? 's' : ''} in lobby</p>
  </div>

  {#if (form as any)?.error}
    <p class="badge badge-pink" style="margin-bottom:1rem;">{(form as any).error}</p>
  {/if}

  <!-- Seeker count (creator only, once 4+ players have joined) -->
  {#if isCreator && players.length > 3}
    <div class="card stack" style="margin-bottom:1.5rem;">
      <div class="row">
        <h3>Seekers</h3>
        <span class="muted">(suggested: {suggested})</span>
      </div>
      <form method="POST" action="?/setSeekerCount" class="row">
        <input name="count" type="number" min="1" max={Math.max(1, players.length - 1)}
          bind:value={seekerCount} style="max-width:80px;" />
        <button type="submit" class="btn">Set</button>
      </form>
    </div>
  {:else if players.length > 3}
    <div class="card" style="margin-bottom:1.5rem;">
      <p class="muted">👁 Seekers: <strong style="color:var(--fg)">{game.seeker_count}</strong> will be randomly chosen when the game starts</p>
    </div>
  {/if}

  <!-- Player list -->
  <div class="card stack" style="margin-bottom:1.5rem; gap:0;">
    <h3 style="margin-bottom:0.75rem;">Players</h3>
    {#each players as player}
      <div class="player-row">
        <span class="player-name">{player.name}</span>
        <span class="badge badge-yellow">waiting</span>
      </div>
    {:else}
      <p class="muted">No players yet — share the code!</p>
    {/each}
  </div>

  <!-- Refresh + Start -->
  <div class="row">
    <button class="btn full" onclick={() => location.reload()}>↻ Refresh</button>
    {#if isCreator}
      <form method="POST" action="?/start" style="flex:1;">
        <button type="submit" class="btn btn-accent full"
          disabled={players.length < 2}>
          Start Game ▶
        </button>
      </form>
    {/if}
  </div>
</div>
