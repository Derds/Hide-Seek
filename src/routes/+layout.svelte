<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>Hide & Seek</title>
</svelte:head>

{@render children()}
