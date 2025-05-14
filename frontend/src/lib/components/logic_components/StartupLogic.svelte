<script>
    import { onMount } from 'svelte';
    onMount(async () => {
        await fetch('http://127.0.0.1:8000/ai/initModels');
        let themeResponse = await fetch('http://127.0.0.1:8000/settings/getTheme');
        let dict = await themeResponse.json();
        document.documentElement.setAttribute('data-theme', dict.theme);
    });
</script>