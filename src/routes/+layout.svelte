<script>
	console.log("ho3")
	import '../app.css';
	import Welcome from '$lib/components/Welcome.svelte';
	import AdaptableNavigation from '$lib/components/AdaptableNavigation.svelte';

	import { onMount } from 'svelte';

	import { getSettings } from '$lib/functions/storefuncs.js';

	import { ModeWatcher } from "mode-watcher";

    import { Toaster } from "$lib/components/ui/sonner/index.js";

	

	let seen_welcome = $state(false);
	
	let { children } = $props();
	

	onMount(async () => {
		const settings = await getSettings();
		const embedding = await settings.get('embedding_model');
		const chat = await settings.get('chat_model');
		const completion = await settings.get('completion_model');

		seen_welcome = embedding && chat && completion;
	});
</script>

<Toaster />
<ModeWatcher />
{#if !seen_welcome}
	<Welcome bind:seen_welcome />
{:else}
	<div class="flex flex-row w-full h-full">
		<AdaptableNavigation />
		{@render children()}
	</div>
{/if}
