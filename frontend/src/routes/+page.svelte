<script>
    import MarkdownEditor from "$lib/components/MarkdownEditor.svelte";

    let current_note = $state(null);

    async function createNote(){
        let res = await fetch('http://127.0.0.1:8000/db/createNote', { method: 'POST' })
        let data = await res.json()
        current_note = data.note_id
    }
</script>

{#if current_note}
    <MarkdownEditor bind:note_id={current_note} />
{:else}
<div class = "flex flex-col w-full h-full items-center justify-center">
    <h1 class = "text-4xl font-bold m-4">No note selected</h1>
    <button class = "btn rounded p-2" onclick={createNote}>New Note</button>
</div>
{/if}