<script>
	console.log("ho3")
	import '../app.css';
	import Welcome from '$lib/components/Welcome.svelte';
	import AdaptableNavigation from '$lib/components/AdaptableNavigation.svelte';

	import { onMount } from 'svelte';

	import { exists, BaseDirectory } from '@tauri-apps/plugin-fs';

	import { ModeWatcher } from "mode-watcher";
	

	let seen_welcome = $state(false);
	
	let { children } = $props();
	

	onMount(async () => {
		seen_welcome = await exists('settings.json', { baseDir: BaseDirectory.AppData });
	});
</script>

<ModeWatcher />
{#if !seen_welcome}
	<Welcome bind:seen_welcome />
{:else}
	<div class="flex flex-row w-full h-full">
		<AdaptableNavigation />
		{@render children()}
	</div>
{/if}
