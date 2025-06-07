<script lang="ts">
  import { goto } from "$app/navigation";

  import { Button } from "$lib/components/ui/button";

  import { toggleMode } from "mode-watcher";

  import { SquareChevronRight, SquareChevronLeft } from "lucide-svelte";
  import { NotebookText, Settings, MessageCircle } from "lucide-svelte";
  import { Sun, Moon } from "lucide-svelte";

  let is_expanded = $state(false);
</script>

<div
  class="h-full {is_expanded ? 'w-64' : 'w-15'} border-r-2 flex flex-col p-2"
>
  <div class="flex flex-col w-full h-full space-y-2">
    <Button
      onclick={() => (is_expanded = !is_expanded)}
      disabled={false}
      class="w-full p-2"
      variant="outline"
    >
      <div class="flex flex-row items-center justify-center w-full">
        {#if is_expanded}
          <SquareChevronLeft class="size-6" />
          <h1 class="text-center w-full">Collapse Menu</h1>
        {:else}
          <SquareChevronRight class="size-6" />
          <span class="sr-only">Collapse Menu</span>
        {/if}
      </div>
    </Button>
    <Button onclick={() => toggleMode()} class="w-full p-2" variant="outline">
      <div class="flex flex-row items-center justify-center w-full">
        {#if is_expanded}
          <Moon class="size-6 transition-all hidden dark:block" />
          <Sun class="size-6 transition-all block dark:hidden" />
          <h1 class="text-center w-full">Toggle Theme</h1>
        {:else}
          <Moon class="size-6 transition-all hidden dark:block" />
          <Sun class="size-6 transition-all block dark:hidden" />
          <span class="sr-only">Toggle theme</span>
        {/if}
      </div>
    </Button>

    <div class="flex h-full flex-grow"></div>

    <Button onclick={() => goto("/")} class="w-full p-2" variant="outline">
      <div class="flex flex-row items-center justify-center w-full">
        {#if is_expanded}
          <NotebookText class="size-6" />
          <h1 class="text-center w-full">Notes</h1>
        {:else}
          <NotebookText class="size-6" />
          <span class="sr-only">Notes</span>
        {/if}
      </div>
    </Button>
    <Button onclick={() => goto("/Chat")} class="w-full p-2" variant="outline">
      <div class="flex flex-row items-center justify-center w-full">
        {#if is_expanded}
          <MessageCircle class="size-6" />
          <h1 class="text-center w-full">Chat</h1>
        {:else}
          <MessageCircle class="size-6" />
          <span class="sr-only">Chat</span>
        {/if}
      </div>
    </Button>
    <div class="flex h-full flex-grow"></div>

    <Button
      onclick={() => goto("/Settings")}
      class="w-full p-2"
      variant="outline"
    >
      <div class="flex flex-row items-center justify-center w-full">
        {#if is_expanded}
          <Settings class="size-6" />
          <h1 class="text-center w-full">Settings</h1>
        {:else}
          <Settings class="size-6" />
          <span class="sr-only">Settings</span>
        {/if}
      </div>
    </Button>
  </div>
</div>
