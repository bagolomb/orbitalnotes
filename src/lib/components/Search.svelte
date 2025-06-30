<script>
    import { Input } from "$lib/components/ui/input/index.js";

    import { search, getAllNoteIds } from '$lib/functions/dbfuncs';

    let { found_note_ids = $bindable([]) } = $props();

    let query = $state("");

    async function dosearch() {
        if (query == "") {
            found_note_ids = await getAllNoteIds();
            console.log(found_note_ids);
            return;
        }
        found_note_ids = await search(query);
        
    }
</script>

<Input placeholder="Search Notes" bind:value={query} oninput={dosearch} />