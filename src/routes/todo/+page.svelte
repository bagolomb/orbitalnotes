<script>
    import { onMount, onDestroy } from 'svelte';

    import { getTodo } from '$lib/functions/storefuncs.js';

    import Task from '$lib/components/Task.svelte';

    let todo_store;
    let todo_list = $state([]);

    onMount(async () => {
        todo_store = await getTodo();
        todo_list = todo_store.get('todo_list');
        console.log(todo_list)
    });

    onDestroy(() => {
        todo_store.set('todo_list', todo_list);
        todo_store.save();
    });
</script>

<div class="w-full h-full flex flex-col items-center space-y-2">
    <div class="w-full h-8 border-b flex items-center justify-center">
        <h1 class="text-2xl">Tasks</h1>
    </div>
    {#each todo_list as task}
        <Task task={task} />
    {/each}
</div>

    