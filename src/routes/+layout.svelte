<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';

  let { children } = $props();

  let fxEnabled = $state(true);

  onMount(() => {
    fxEnabled = localStorage.getItem('hide-seek-fx') !== 'off';
    updateClass(fxEnabled);
  });

  function toggleFx() {
    fxEnabled = !fxEnabled;
    localStorage.setItem('hide-seek-fx', fxEnabled ? 'on' : 'off');
    updateClass(fxEnabled);
  }

  function updateClass(enabled: boolean) {
    document.documentElement.classList.toggle('no-fx', !enabled);
  }
</script>

<svelte:head>
  <title>Hide & Seek</title>
</svelte:head>

{@render children()}

<div class="scan-beam" aria-hidden="true"></div>

<button class="fx-toggle" onclick={toggleFx} title="Toggle visual effects">
  {fxEnabled ? '✦ FX ON' : '◌ FX OFF'}
</button>
