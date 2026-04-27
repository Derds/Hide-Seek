<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const { game, seekers, foundOrder, neverFound, gameDurationSecs, topFinders, longestHiders } = $derived(data);

  let tab = $state<'create' | 'join'>('join');
  let savedName = $state('');

  onMount(() => {
    savedName = localStorage.getItem('hide-seek-name') ?? '';
  });

  function saveName(e: SubmitEvent) {
    const input = (e.target as HTMLFormElement).querySelector('input[name="name"]') as HTMLInputElement;
    if (input?.value) localStorage.setItem('hide-seek-name', input.value);
  }

  function fmtSecs(s: number | null) {
    if (!s) return '—';
    const m = Math.floor(s / 60), sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  }
</script>

<div class="container" style="padding-bottom:4rem;">
  <div class="center stack" style="gap:0.5rem; margin-bottom:2.5rem; padding-top:2.5rem;">
    <h1 class="glitch" data-text="GAME OVER">GAME OVER</h1>
    <p class="muted">{game.id} · duration: {fmtSecs(gameDurationSecs)}</p>
  </div>

  <!-- Found order -->
  <div class="card stack" style="margin-bottom:1.5rem; gap:0;">
    <h3 style="margin-bottom:0.75rem;">🏁 Found order</h3>
    {#each foundOrder as p, i}
      <div class="player-row">
        <div class="row" style="gap:0.5rem;">
          <span style="color:var(--muted); min-width:1.5rem;">#{i + 1}</span>
          <span class="player-name">{p.name}</span>
        </div>
        <div class="row" style="gap:0.5rem;">
          <span class="muted" style="font-size:0.8rem;">by {p.found_by}</span>
        </div>
      </div>
    {:else}
      <p class="muted">No hiders were found.</p>
    {/each}
  </div>

  <!-- Never found -->
  {#if neverFound.length}
    <div class="card stack" style="margin-bottom:1.5rem; gap:0; border-color:var(--accent);">
      <h3 style="margin-bottom:0.75rem; color:var(--accent);">🫣 Never found ({neverFound.length})</h3>
      {#each neverFound as p}
        <div class="player-row">
          <span class="player-name">{p.name}</span>
          <span class="badge badge-green">escaped!</span>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Seekers this game -->
  <div class="card stack" style="margin-bottom:2rem; gap:0;">
    <h3 style="margin-bottom:0.75rem;">🔍 Seekers this game</h3>
    {#each seekers as s}
      {@const finds = (foundOrder as any[]).filter((p: any) => p.found_by === s.name).length}
      <div class="player-row">
        <span class="player-name">{s.name}</span>
        <span class="muted">{finds} find{finds !== 1 ? 's' : ''}</span>
      </div>
    {/each}
  </div>

  <hr class="divider" />

  <!-- Global leaderboards -->
  <h2 class="glitch-slow" data-text="🏆 All-time leaderboard" style="margin-bottom:1.5rem;">🏆 All-time leaderboard</h2>

  <div style="display:grid; gap:1.5rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
    <div class="card stack" style="gap:0;">
      <h3 class="glitch-slow" data-text="🏃 Quickest finders" style="margin-bottom:0.75rem; color:var(--danger);">🏃 Quickest finders</h3>
      {#each (topFinders as any[]) as row, i}
        <div class="player-row">
          <div class="row" style="gap:0.5rem;">
            <span class="muted" style="min-width:1.5rem;">#{i + 1}</span>
            <span class="player-name" class:glitch-slow={i === 0} data-text={i === 0 ? row.player_name : undefined}>{row.player_name}</span>
          </div>
          <span class="muted" style="font-size:0.8rem;">{row.total_finds} finds</span>
        </div>
      {:else}
        <p class="muted">No data yet</p>
      {/each}
    </div>

    <div class="card stack" style="gap:0;">
      <h3 class="glitch-slow" data-text="🫣 Longest hiders" style="margin-bottom:0.75rem; color:var(--accent);">🫣 Longest hiders</h3>
      {#each (longestHiders as any[]) as row, i}
        <div class="player-row">
          <div class="row" style="gap:0.5rem;">
            <span class="muted" style="min-width:1.5rem;">#{i + 1}</span>
            <span class="player-name" class:glitch-slow={i === 0} data-text={i === 0 ? row.player_name : undefined}>{row.player_name}</span>
          </div>
          <span class="muted" style="font-size:0.8rem;">{fmtSecs(row.best_survival_secs)}</span>
        </div>
      {:else}
        <p class="muted">No data yet</p>
      {/each}
    </div>
  </div>

  <hr class="divider" style="margin-top:2.5rem;" />

  <!-- Play next game -->
  <h2 style="margin:2rem 0 1.25rem; text-align:center;">Play another?</h2>

  <div style="max-width:440px; margin:0 auto;">
    <div class="row" style="margin-bottom:1.25rem; gap:0;">
      <button class="btn full" class:btn-accent={tab === 'create'} class:btn-tab={tab !== 'create'} onclick={() => tab = 'create'}>
        Create Game
      </button>
      <button class="btn full" class:btn-accent={tab === 'join'} class:btn-tab={tab !== 'join'} onclick={() => tab = 'join'}>
        Join Game
      </button>
    </div>

    {#if tab === 'create'}
      <form method="POST" action="/?/create" class="card stack" onsubmit={saveName}>
        <div>
          <label for="next-create-name">Your name</label>
          <input id="next-create-name" name="name" type="text" placeholder="e.g. Alex" autocomplete="off" required bind:value={savedName} />
        </div>
        <button type="submit" class="btn btn-accent full">Create Game →</button>
      </form>
    {:else}
      <form method="POST" action="/?/join" class="card stack" onsubmit={saveName}>
        <div>
          <label for="next-join-code">Game code</label>
          <input id="next-join-code" name="code" type="text" placeholder="e.g. HIDE-4821"
            style="text-transform:uppercase; letter-spacing:2px;"
            autocomplete="off" required />
        </div>
        <div>
          <label for="next-join-name">Your name</label>
          <input id="next-join-name" name="name" type="text" placeholder="e.g. Jordan" autocomplete="off" required bind:value={savedName} />
        </div>
        <button type="submit" class="btn btn-accent full">Join Game →</button>
      </form>
    {/if}
  </div>
</div>
