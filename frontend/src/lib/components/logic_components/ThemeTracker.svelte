<script>
    import { onMount, onDestroy } from 'svelte';

    let observer;

    // Replace URL with your actual endpoint
    async function saveTheme(newTheme) {
    await fetch('http://127.0.0.1:8000/api/settings/setTheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify( { theme: newTheme })
    });
    }

    onMount(() => {
    const target = document.documentElement; // typically <html>

    observer = new MutationObserver(mutations => {
        for (const { attributeName } of mutations) {
        if (attributeName === 'data-theme') {
            const newTheme = target.getAttribute('data-theme');
            saveTheme(newTheme); // fire-and-forget; you can await if needed
        }
        }
    });

    observer.observe(target, { attributes: true });
    });

    onDestroy(() => {
    observer.disconnect();
    });
</script>