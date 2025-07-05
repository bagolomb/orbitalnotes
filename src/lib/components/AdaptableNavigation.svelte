<script>
    import { goto } from "$app/navigation";

    import { Button } from "$lib/components/ui/button";

    import { toggleMode } from "mode-watcher";

    import { SquareChevronRight, SquareChevronLeft } from 'lucide-svelte';
    import { NotebookText, Settings, MessageCircle, Share2, Brain, CircleHelp, ListTodo } from 'lucide-svelte';
    import { Sun, Moon } from "lucide-svelte";
    
    let is_expanded = $state(false);

</script>

<div class="h-full {is_expanded ? 'w-64' : 'w-15'} border-r-2 flex flex-col p-2">
    <div class="flex flex-col w-full h-full space-y-2">
        <Button onclick={() => is_expanded = !is_expanded} class="w-full p-2" variant="outline">
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
                    <Moon class="size-6 transition-all hidden dark:block"/>
                    <Sun class="size-6 transition-all block dark:hidden"/>
                    <h1 class="text-center w-full">Toggle Theme</h1>
                {:else}
                    <Moon class="size-6 transition-all hidden dark:block"/>
                    <Sun class="size-6 transition-all block dark:hidden"/>
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
        <Button onclick={() => goto("/todo")} class="w-full p-2" variant="outline">
            <div class="flex flex-row items-center justify-center w-full">
                {#if is_expanded}
                    <ListTodo class="size-6" />
                    <h1 class="text-center w-full">To Do</h1>
                {:else}
                    <ListTodo class="size-6" />
                    <span class="sr-only">To Do</span>
                {/if}
            </div>
        </Button>
        <Button onclick={() => goto("/chat")} class="w-full p-2" variant="outline">
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
        <Button onclick={() => goto("/mindmap")} class="w-full p-2" variant="outline">
            <div class="flex flex-row items-center justify-center w-full">
                {#if is_expanded}
                    <Brain class="size-6" />
                    <h1 class="text-center w-full">Mindmap</h1>
                {:else}
                    <Brain class="size-6" />
                    <span class="sr-only">Mindmap</span>
                {/if}
            </div>
        </Button>
                <Button onclick={() => goto("/svelteflow")} class="w-full p-2" variant="outline">
            <div class="flex flex-row items-center justify-center w-full">
                {#if is_expanded}
                     svelteflow
                    <h1 class="text-center w-full">Svelteflow</h1>
                {:else}
                    brady
                    <span class="sr-only">Svelteflow</span>
                {/if}
            </div>
        </Button>
        <Button onclick={() => goto("/visualize")} class="w-full p-2" variant="outline">
            <div class="flex flex-row items-center justify-center w-full">
                {#if is_expanded}
                    <Share2 class="size-6" />
                    <h1 class="text-center w-full">Visualize</h1>
                {:else}
                    <Share2 class="size-6" />
                    <span class="sr-only">Visualize</span>
                {/if}
            </div>
        </Button>
        <div class="flex h-full flex-grow"></div>

        <Button onclick={() => goto("/settings")} class="w-full p-2" variant="outline">
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
        <Button onclick={() => goto("/guide")} class="w-full p-2" variant="outline">
            <div class="flex flex-row items-center justify-center w-full">
                {#if is_expanded}
                    <CircleHelp class="size-6" />
                    <h1 class="text-center w-full">Guide</h1>
                {:else}
                    <CircleHelp class="size-6" />
                    <span class="sr-only">Guide</span>
                {/if}
            </div>
        </Button>
    </div>

</div>

