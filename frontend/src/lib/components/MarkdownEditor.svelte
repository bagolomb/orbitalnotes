<script>
    import {onMount} from "svelte"

    import {basicSetup} from "codemirror"
    import {EditorState} from "@codemirror/state"
    import {EditorView} from "@codemirror/view"
    import {markdown} from "@codemirror/lang-markdown"

    import { marked } from "marked"

    let { note_id=$bindable() } = $props();
    let note_title = $state('');

    let eView
    let eState
    let editorElement
    let listener

    let renderedHTML= $state('');

    async function saveNote(){
        let res = await fetch('http://127.0.0.1:8000/api/db/updateNote', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: note_id, title: note_title, content: eState.doc.toString() })
        })
        let data = await res.json()
        console.log(data)
    }
    
    onMount(() => {

        listener = EditorView.updateListener.of(update => {
            if (update.docChanged) {
                renderedHTML = marked.parse(update.state.doc.toString());
            }
        });

        eState = EditorState.create({
            doc: "# Example Heading",
            extensions: [
                basicSetup,
                markdown(),
                listener,
            ]
        })
        eView = new EditorView({
            state: eState, 
            parent: editorElement 
        });
        renderedHTML = marked.parse(eState.doc.toString());
    })

</script>

<div class="flex flex-col h-full w-full">
    <div class="flex items-center justify-center w-full p-2 h-16">
        <input type="text" class="input w-full" bind:value={note_title} placeholder="Note Title"/>
        <button class="btn btn-soft" onclick={saveNote}>Save</button>
    </div>
    <div class="flex flex-row h-full w-full p-2">
        <div bind:this={editorElement} class="h-full w-1/2">
        </div>
        <div class="h-full w-1/2 prose font-sans text-base">
        {@html renderedHTML}
        </div>
    </div>
</div>