<script>
    import logo from '$lib/assets/OrbitalNotesIcon.png';
    import Initalizing from '$lib/components/Initalizing.svelte';
    let {showWelcomeScreen= $bindable()} = $props();
    let showInitializingScreen = $state(false);

    async function getStarted() {
        showInitializingScreen = true;

        await Promise.all([
            fetch('http://127.0.0.1:8000/api/settings/init', { method: 'POST' }),
            fetch('http://127.0.0.1:8000/api/db/init',       { method: 'POST' }),
            fetch('http://127.0.0.1:8000/api/ai/downloadModels'),
        ]);

        showWelcomeScreen      = false;
        showInitializingScreen = false;
    }
</script>
  
{#if showInitializingScreen}
    <Initalizing />
{:else}
    <div class="min-h-screen bg-gradient-to-br from-white to-zinc-500 w-full flex flex-col items-center justify-center space-y-6 px-4">
        <h1 class="text-4xl font-bold text-gray-800">Welcome to Orbital Notes</h1>
        <img src={logo} alt="Orbital Notes Logo" class="w-1/2 h-1/2 object-contain" />
        <button class="px-4 py-2 btn btn-primary" onclick={getStarted}>
            Get Started
        </button>
    </div>
{/if}