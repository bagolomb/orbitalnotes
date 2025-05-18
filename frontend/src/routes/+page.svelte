<script>
    import MarkdownEditor from "$lib/components/MarkdownEditor.svelte";
    import { goto } from '$app/navigation';


    async function createNote(){
        let res = await fetch('http://127.0.0.1:8000/api/db/createNote', { method: 'POST' })
        let data = await res.json()
        goto(`/editor/${data.note_id}`)
    }
</script>

<div class="flex flex-row h-full w-full p-2">
    <div class = "flex flex-col w-full h-full items-center justify-center">
        <h1 class = "text-4xl font-bold m-4">No note selected</h1>
        <button class = "btn rounded p-2" onclick={createNote}>New Note</button>
    </div>
</div>