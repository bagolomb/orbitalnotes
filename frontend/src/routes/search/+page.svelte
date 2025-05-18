<script>
    import { onMount } from 'svelte';
    import NotePreview from '$lib/components/NotePreview.svelte';

    let notes = $state([]);

    let query_state = $state("");

    async function search() {
        let res = await fetch('http://127.0.0.1:8000/api/db/search',{
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query_state })
        })
        console.log("Hi")
        let data = await res.json()
        console.log(data)
    }
    
    onMount(async () => {
        let res = await fetch('http://127.0.0.1:8000/api/db/getXMostRecentlyUpdatedNotes',{
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify( { x: 10, offset: 0 })
        })
        let data = await res.json()
        notes = data
        console.log(data)

    })

</script>

<div class="flex flex-col h-full w-full p-2">
    <div class="flex items-center justify-center">
        <input type="text" bind:value={query_state} class="input w-full" />
        <button class="btn btn-soft" onclick={search}>Search</button>
    </div>
    <div class = "flex flex-col w-full h-full overflow-auto space-y-2">
        {#each notes as note}
            <NotePreview note={note} />
        {/each}
    </div>
</div>
    