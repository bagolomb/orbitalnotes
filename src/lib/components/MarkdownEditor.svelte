<script>
	import { onMount } from 'svelte';
	import { getNote, editNote } from '$lib/functions/dbfuncs';
	import * as Resizable from "$lib/components/ui/resizable/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Button } from "$lib/components/ui/button/index.js";

	import { marked } from 'marked';

	let { note_id=$bindable() } = $props();

	let raw_markdown = $state('');
	let note_title = $state('');
	let markdown_html = $derived(marked(raw_markdown));

	onMount(async () => {
		if (note_id !== null) {
			const note = await getNote(note_id);
			console.log(note)
			raw_markdown = note.note_content;
			note_title = note.note_title;
		}
	});

    function saveNote() {
        editNote(note_id, note_title, raw_markdown);
    }
</script>

<div class="w-full h-full flex flex-col">
	<div class="flex flex-row pl-2 pr-2 pt-2 space-x-2">
		<Input placeholder="Title" bind:value={note_title} class="w-full"/>
		<Button onclick={saveNote}>Save Note</Button>
	</div>
	<Resizable.PaneGroup direction="horizontal">
		<Resizable.Pane defaultSize={50}>
			<div class="p-2 space-y-2 w-full h-full">
				<Textarea bind:value={raw_markdown} class="resize-none w-full h-full rounded-none" />
			</div>
		</Resizable.Pane>
		<Resizable.Handle class="w-3" />
		<Resizable.Pane defaultSize={50}>
			<div class="p-2 w-full h-full prose prose-invert">
				{@html markdown_html}
			</div>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>