<script>
    import {onMount} from "svelte"

    import {basicSetup} from "codemirror"
    import {EditorState} from "@codemirror/state"
    import {EditorView} from "@codemirror/view"
    import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
    import {markdown} from "@codemirror/lang-markdown"
    import { markdownLanguage } from "@codemirror/lang-markdown"
    import { tags } from '@lezer/highlight'

    import { marked } from "marked"

    const markdownHighlightStyle = HighlightStyle.define([
        // ATX headings
        { tag: tags.heading1,       class: "cm-heading1" },
        { tag: tags.heading2,       class: "cm-heading2" },
        { tag: tags.heading3,       class: "cm-heading3" },
        { tag: tags.heading4,       class: "cm-heading4" },
        { tag: tags.heading5,       class: "cm-heading5" },
        { tag: tags.heading6,       class: "cm-heading6" },

        // inline styles
        { tag: tags.strong,         class: "cm-strong" },
        { tag: tags.emphasis,       class: "cm-emphasis" },
        { tag: tags.strikethrough,  class: "cm-strikethrough" },

        // links
        { tag: tags.link,           class: "cm-link" },
        { tag: tags.url,            class: "cm-url" },

        // lists & quotes
        { tag: tags.list,           class: "cm-list" },
        { tag: tags.quote,          class: "cm-quote" },

        // inline/fenced code _content_
        { tag: tags.literal,        class: "cm-literal" },
    ])



    let { note_id=$bindable() } = $props();

    let eView
    let eState
    let editorElement
    let listener

    let renderedHTML= $state('');
    
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
                syntaxHighlighting(markdownHighlightStyle),
            ]
        })
        eView = new EditorView({
            state: eState, 
            parent: editorElement 
        });
        renderedHTML = marked.parse(eState.doc.toString());
    })

</script>

<div class="flex flex-row h-full w-full">
    <div bind:this={editorElement} class="h-full w-1/2 ">
    </div>
    <div class="h-full w-1/2 prose font-sans text-base">
        {@html renderedHTML}
    </div>
</div>