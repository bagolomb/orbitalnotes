<script>
    import { SquareChevronRight, SquareChevronLeft } from '@lucide/svelte';
    let expanded = $state(false);
  </script>
  
  <div class="flex flex-col h-full p-2 border-r-2 {expanded ? 'w-64' : 'w-16'}">
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

  </div>
  