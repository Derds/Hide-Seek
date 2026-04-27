<script lang="ts">
  import { page } from '$app/stores';
</script>

<div style="
  position: fixed; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 1.5rem; padding: 2rem; text-align: center;
">
  <p class="muted" style="text-transform:uppercase; letter-spacing:4px; font-size:0.8rem;">error {$page.status}</p>
  <h1 class="glitch" data-text={$page.error?.message ?? 'Not Found'}
    style="font-size:clamp(2.5rem,10vw,5rem); line-height:1.1;">
    {$page.error?.message ?? 'Not Found'}
  </h1>
  <a href="/" class="btn btn-accent" style="margin-top:0.5rem;">← Back to home</a>
</div>
