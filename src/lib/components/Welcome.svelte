<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  import { initSettings } from "$lib/functions/storefuncs";
  import { initDB } from "$lib/functions/dbfuncs";

  let { seen_welcome = $bindable() } = $props();

  async function runInitSequence() {
    await initDB();
    await initSettings();
    seen_welcome = true;
  }
</script>

<div class="h-full w-full flex flex-col items-center justify-center">
  <img
    src="/OrbitalNotesIconBlack.png"
    class="h-1/2 dark:hidden"
    alt="Light Orbital Notes Icon"
  />
  <img
    src="/OrbitalNotesIconWhite.png"
    class="h-1/2 hidden dark:block"
    alt="Dark Orbital Notes Icon"
  />
  <h1 class="text-4xl">Welcome to Orbital Notes</h1>
  <Button onclick={runInitSequence}>Get Started</Button>
</div>
