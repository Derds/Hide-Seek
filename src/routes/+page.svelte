<script lang="ts">
  import type { ActionData } from './$types';
  let { form }: { form: ActionData } = $props();
  let tab = $state((form as any)?.tab ?? 'create');
</script>

<div class="container" style="max-width:480px; padding-top:4rem;">
  <div class="center stack" style="gap:0.5rem; margin-bottom:3rem;">
    <h1 class="glitch" data-text="HIDE&SEEK">HIDE&SEEK</h1>
    <p class="muted">no one gets left behind</p>
  </div>

  <div class="row" style="margin-bottom:1.5rem; gap:0;">
    <button class="btn full" class:btn-accent={tab === 'create'} class:btn-tab={tab !== 'create'} onclick={() => tab = 'create'}>
      Create Game
    </button>
    <button class="btn full" class:btn-accent={tab === 'join'} class:btn-tab={tab !== 'join'} onclick={() => tab = 'join'}>
      Join Game
    </button>
  </div>

  {#if (form as any)?.error}
    <p class="badge badge-pink" style="margin-bottom:1rem;">{(form as any).error}</p>
  {/if}

  {#if tab === 'create'}
    <form method="POST" action="?/create" class="card stack">
      <div>
        <label for="create-name">Your name</label>
        <input id="create-name" name="name" type="text" placeholder="e.g. Alex" autocomplete="off" required />
      </div>
      <p class="muted">You'll set the number of seekers once everyone has joined.</p>
      <button type="submit" class="btn btn-accent full">Create Game →</button>
    </form>
  {:else}
    <form method="POST" action="?/join" class="card stack">
      <div>
        <label for="join-code">Game code</label>
        <input id="join-code" name="code" type="text" placeholder="e.g. HIDE-4821"
          style="text-transform:uppercase; letter-spacing:2px;"
          autocomplete="off" required />
      </div>
      <div>
        <label for="join-name">Your name</label>
        <input id="join-name" name="name" type="text" placeholder="e.g. Jordan" autocomplete="off" required />
      </div>
      <button type="submit" class="btn btn-accent full">Join Game →</button>
    </form>
  {/if}
</div>
