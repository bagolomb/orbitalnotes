<script>
    import { goto } from '$app/navigation';
    import { SquareChevronRight, SquareChevronLeft, Settings, FilePlus, FileSearch2, MessageSquare } from '@lucide/svelte';
    let expanded = $state(false);
  </script>
  
  <div class="flex flex-col h-full p-2 border-r-2 space-y-4 {expanded ? 'w-64' : 'w-16'}">

    <button onclick={() => expanded = !expanded} class="btn btn-soft w-full flex p-0">
        <div class="flex w-full items-center justify-center p-2">
            {#if expanded}
                <SquareChevronLeft class="w-6 h-6 flex-shrink-0"/>
                <div class="flex-1 text-center">Minimize</div>
            {:else}
                <SquareChevronRight class="w-6 h-6 flex-shrink-0"/>
            {/if}
        </div>
    </button>

    <div class="flex flex-1"></div>

    <button onclick={() => goto("/")} class="btn btn-soft w-full flex p-0">
        <div class="flex w-full items-center justify-center p-2">
            <FilePlus class="w-6 h-6 flex-shrink-0"/>
            {#if expanded}
                <div class="flex-1 text-center">New Note</div>
            {/if}
        </div>
    </button>
    <button onclick={() => goto("/search")} class="btn btn-soft w-full flex p-0">
        <div class="flex w-full items-center justify-center p-2">
            <FileSearch2 class="w-6 h-6 flex-shrink-0"/>
            {#if expanded}
                <div class="flex-1 text-center">Search</div>
            {/if}
        </div>
    </button>
    <button onclick={() => goto("/chat")} class="btn btn-soft w-full flex p-0">
        <div class="flex w-full items-center justify-center p-2">
            <MessageSquare class="w-6 h-6 flex-shrink-0"/>
            {#if expanded}
                <div class="flex-1 text-center">Chat</div>
            {/if}
        </div>
    </button>

    <div class="flex flex-1"></div>

    <button onclick={() => goto("/settings")} class="btn btn-soft w-full flex p-0">
        <div class="flex w-full items-center justify-center p-2">
            <Settings class="w-6 h-6 flex-shrink-0"/>
            {#if expanded}
                <div class="flex-1 text-center">Settings</div>
            {/if}
        </div>
    </button>
    



  </div>
  