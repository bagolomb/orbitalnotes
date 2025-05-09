<script>
    import { Menu } from '@lucide/svelte';
    let expanded = $state(false);
  </script>
  
  <div class="flex flex-col h-full p-2 border-r-2 {expanded ? 'w-64' : 'w-16'}">
    <button class="btn btn-soft w-full flex items-center"
    onclick={() => expanded = !expanded}>
        <Menu class="flex-none text-primary-text" />
        <div class="flex w-full h-full justify-center items-center">
            {#if expanded}
                <h1>Menu</h1>
            {/if}
        </div>
    </button>

  </div>
  