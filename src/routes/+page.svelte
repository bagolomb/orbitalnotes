<script>
    import { goto } from '$app/navigation';

    import { onMount } from 'svelte';
    import Search from '$lib/components/Search.svelte';

    import { Button } from "$lib/components/ui/button/index.js";
    
    import { createNote, getAllNoteIds, search } from '$lib/functions/dbfuncs';

    import NotePreview from '$lib/components/NotePreview.svelte';

    let preview_note_ids = $state([]);

    async function createNewNote() {
        const note_id = await createNote('', '');
        goto(`/editor/${note_id}`);
    }

    onMount(async () => {

        preview_note_ids = await getAllNoteIds();
        
    });

</script>
<div class="w-full h-full flex flex-col">
    <div class="flex flex-row items-center p-2 space-x-2">
        <Search bind:found_note_ids={preview_note_ids} /> 
        <Button onclick={createNewNote}>Create New Note</Button>
    </div>
    <!-- Responsive grid for note previews -->
	<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
		{#each preview_note_ids as note}
            <NotePreview note_id={note} />
		{/each}
	</div>
</div>