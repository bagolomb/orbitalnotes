<script>
	export const ssr = false;
	export const prerender = true;
	import { onMount } from 'svelte';
	import '../app.css';
	import Welcome from '$lib/components/Welcome.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import SideNav from '$lib/components/SideNav.svelte';
	import ThemeTracker from '$lib/components/logic_components/ThemeTracker.svelte';
	import StartupLogic from '$lib/components/logic_components/StartupLogic.svelte';
	
	let { children } = $props();
	let showLoadingScreen = $state(true);
	let showWelcomeScreen = $state(false);

	let data

	console.log("Hi")
	
	onMount(async () => {
	try {
		const res = await fetch('http://127.0.0.1:8000/settings/checkIfSettingsExist');
		console.log('status:', res.status);
		const text = await res.text();
		console.log('raw text:', text);

		data = JSON.parse(text);
		showWelcomeScreen = !data.exists;
		console.log(showWelcomeScreen)
	} catch (err) {
		console.error('Fetch failed:', err);
		showWelcomeScreen = true;
	} finally {
		showLoadingScreen = false;
	}
});
</script>

{#if showLoadingScreen}
  <Loading />
{:else if showWelcomeScreen}
  <Welcome bind:showWelcomeScreen={showWelcomeScreen}/>
{:else}
	<StartupLogic />
	<ThemeTracker />
	<div class="h-full w-full flex">
		<SideNav />
		{@render children()}
	</div>
{/if}