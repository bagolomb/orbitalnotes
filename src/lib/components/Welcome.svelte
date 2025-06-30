<script>
    import { onMount } from 'svelte';

    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import { toast } from "svelte-sonner";

    import { getSettings } from '$lib/functions/storefuncs.js';
    import { initDB } from '$lib/functions/dbfuncs.js';
    import ModelSettings from '$lib/components/ModelSettings.svelte';

    let { seen_welcome=$bindable() } = $props();
    let settingsStore;

    async function runInitSequence() {
      const embedding = await settingsStore.get('embedding_model');
      const chat = await settingsStore.get('chat_model');
      const completion = await settingsStore.get('completion_model');
      console.log(embedding, chat, completion);
      if (!embedding || !chat || !completion) {
          toast.error("Please configure your models")
          return;
      }
            
      await initDB();
      seen_welcome = true;
    }

    onMount(async () => {
        settingsStore = await getSettings();
        settingsStore.save();
        console.log(await settingsStore.get('embedding_model'));
    });

</script>

<div class="min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-8">
    <div class="flex flex-col items-center space-y-4 sm:space-y-6 text-center">
      <h1 class="text-2xl sm:text-4xl">Welcome to Orbital Notes</h1>
  
      <img
        src="/OrbitalNotesIconBlack.png"
        class="h-32 sm:h-48 dark:hidden"
        alt="Light Orbital Notes Icon"
      />
      <img
        src="/OrbitalNotesIconWhite.png"
        class="h-32 sm:h-48 hidden dark:block"
        alt="Dark Orbital Notes Icon"
      />
  
      <h2 class="text-lg sm:text-2xl">Please Configure Your Models</h2>
      <ModelSettings />
    </div>
  
    <Separator class="my-4" />
  
    <div class="w-full flex justify-center">
      <Button
        onclick={runInitSequence}
        class="w-4/5 sm:w-2/3 max-w-md text-lg sm:text-2xl py-4 sm:py-6 rounded-xl"
      >
        Get Started
      </Button>
    </div>
  </div>
  
  
