<script>
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }
</script>

<fieldset class="join join-vertical">
    <input type="radio" name="theme" class="btn btn-soft" onclick={() => setTheme('light')} aria-label="Light Theme">
    <input type="radio" name="theme" class="btn btn-soft" onclick={() => setTheme('dark')} aria-label="Dark Theme">
</fieldset>


    