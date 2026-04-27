<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const { game, seekers, foundOrder, neverFound, gameDurationSecs, topFinders, longestHiders } = $derived(data);

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
  <h2 style="margin-bottom:1.5rem;">🏆 All-time leaderboard</h2>

  <div style="display:grid; gap:1.5rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
    <div class="card stack" style="gap:0;">
      <h3 style="margin-bottom:0.75rem; color:var(--danger);">🏃 Quickest finders</h3>
      {#each (topFinders as any[]) as row, i}
        <div class="player-row">
          <div class="row" style="gap:0.5rem;">
            <span class="muted" style="min-width:1.5rem;">#{i + 1}</span>
            <span class="player-name">{row.player_name}</span>
          </div>
          <span class="muted" style="font-size:0.8rem;">{row.total_finds} finds</span>
        </div>
      {:else}
        <p class="muted">No data yet</p>
      {/each}
    </div>

    <div class="card stack" style="gap:0;">
      <h3 style="margin-bottom:0.75rem; color:var(--accent);">🫣 Longest hiders</h3>
      {#each (longestHiders as any[]) as row, i}
        <div class="player-row">
          <div class="row" style="gap:0.5rem;">
            <span class="muted" style="min-width:1.5rem;">#{i + 1}</span>
            <span class="player-name">{row.player_name}</span>
          </div>
          <span class="muted" style="font-size:0.8rem;">{fmtSecs(row.best_survival_secs)}</span>
        </div>
      {:else}
        <p class="muted">No data yet</p>
      {/each}
    </div>
  </div>

  <div class="center" style="margin-top:2.5rem;">
    <a href="/" class="btn btn-accent">Play again →</a>
  </div>
</div>
