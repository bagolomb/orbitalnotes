<script>
	import { onMount } from 'svelte';
	import { getNote, editNote } from '$lib/functions/dbfuncs';
	import * as Resizable from "$lib/components/ui/resizable/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Button } from "$lib/components/ui/button/index.js";

	// Your generate function signature: generate(prefix: string, suffix: string, signal: AbortSignal)
	import { generate } from '$lib/functions/aifuncs.js';
	import { getTitles, getTags } from '$lib/functions/dbfuncs';

	import { basicSetup } from "codemirror";
	import { EditorView, Decoration, WidgetType, ViewPlugin, keymap } from "@codemirror/view";
	import { StateField, StateEffect } from "@codemirror/state";
	import { autocompletion } from "@codemirror/autocomplete";

	
	import { marked } from 'marked';
    marked.use({
        gfm: true,
        breaks: true,
    });

	let codemirror_element;
	let { note_id } = $props();

	let raw_markdown = $state('');
	let note_title = $state('');
	let markdown_html = $derived(marked(raw_markdown));

	let tags = $state([]);
	let titles = $state([]);

	function customAutocomplete(context) {
		const word = context.matchBefore(/@[\w]*|(\[\[[^\]]*)?$/);

		if (!word) return null;

		if (word.text.startsWith("@")) {
				const query = word.text.slice(1);
		return {
			from: word.from + 1,
			options: tags
				.filter(tag => tag.startsWith(query))
				.map(tag => ({ label: tag, type: "keyword" })),
			};
		}

		if (word.text.startsWith("[[")) {
			const query = word.text.slice(2);
			return {
			from: word.from + 2,
			options: titles
				.filter(title => title.toLowerCase().startsWith(query.toLowerCase()))
				.map(title => ({ label: title, type: "text" })),
			};
		}

		return null;
	}

	// ─── 1) StateEffect and StateField for the ghost suggestion ───────────────────────

	// Carries either { from: number, text: string } or null (to clear)
	const setSuggestion = StateEffect.define();

	// Holds the current suggestion in the editor state
	const suggestionField = StateField.define({
		create() {
			return { from: null, text: "" };
		},
		update(value, tr) {
			for (let e of tr.effects) {
				if (e.is(setSuggestion)) {
					if (e.value) {
						return { from: e.value.from, text: e.value.text };
					}
					return { from: null, text: "" };
				}
			}
			return value;
		}
	});

	// ─── 2) GhostWidget renders inline ghost text ─────────────────────────────────────

	class GhostWidget extends WidgetType {
		constructor(text) {
			super();
			this.text = text;
		}
		toDOM() {
			const span = document.createElement("span");
			span.textContent = this.text;
			span.style.opacity = "0.4";
			span.style.pointerEvents = "none";
			span.style.userSelect = "none";
			span.style.fontStyle = "italic";
			return span;
		}
		ignoreEvent() {
			return true;
		}
	}

	// ─── 3) ViewPlugin handles debounced streaming calls to generate(prefix, suffix) ──

	const ghostPlugin = ViewPlugin.fromClass(
		class {
			view;
			timeoutID = null;
			controller = null;      // AbortController for cancellation
			streamBuffer = "";      // Accumulates streamed text
			startPos = null;        // Cursor position where completion begins

			constructor(view) {
				this.view = view;
				// Clear any existing suggestion on init (queued to avoid nested update)
				setTimeout(() => {
					this.view.dispatch({ effects: setSuggestion.of(null) });
				}, 0);
			}

			update(update) {
				// If the document changed or the selection moved, cancel and debounce
				if (update.docChanged || update.selectionSet) {
					if (this.timeoutID) {
						clearTimeout(this.timeoutID);
						this.timeoutID = null;
					}
					if (this.controller) {
						this.controller.abort();
						this.controller = null;
					}
					// Clear the current suggestion, but queue dispatch to avoid "update in progress"
					setTimeout(() => {
						this.view.dispatch({ effects: setSuggestion.of(null) });
					}, 0);
					this.streamBuffer = "";

					this.timeoutID = setTimeout(() => {
						this.startCompletionStream();
					}, 300);
				}
			}

			async startCompletionStream() {
				const docText = this.view.state.doc.toString();
				const cursorPos = this.view.state.selection.main.head;
				this.startPos = cursorPos;

				const prefix = docText.slice(0, cursorPos);
				const suffix = docText.slice(cursorPos);

				try {
					this.controller = new AbortController();
					const signal = this.controller.signal;

					// This is now an async iterable, not a stream with getReader()
					const stream = await generate(prefix, suffix, signal);
					this.streamBuffer = "";

					for await (const chunk of stream) {
						if (signal.aborted) break;
						this.streamBuffer += chunk.response;  // ⬅️ Fix is here
						this.view.dispatch({
							effects: setSuggestion.of({
								from: this.startPos,
								text: this.streamBuffer
							})
						});
					}
					this.controller = null;
				} catch (err) {
					if (err.name !== "AbortError") {
						console.error("Streaming error:", err);
					}
				}
			}

			get decorations() {
				const state = this.view.state;
				const sug   = state.field(suggestionField);
				if (sug.from === null || !sug.text) return Decoration.none;
				const widget = Decoration.widget({
					widget: new GhostWidget(sug.text),
					side: 1
				});
				return Decoration.set([widget.range(sug.from)]);
			}
		},
		{
			decorations: (v) => v.decorations
		}
	);

	// ─── 4) Tab keymap to accept the ghost suggestion ─────────────────────────────────

	const acceptTab = keymap.of([{
		key: "Tab",
		run: (view) => {
			const sug = view.state.field(suggestionField);
			if (sug.from !== null && sug.text) {
				view.dispatch({
					changes: { from: sug.from, to: sug.from, insert: sug.text },
					effects: setSuggestion.of(null)
				});
				return true;
			}
			return false;
		}
	}]);

	function ghostTextPlugin() {
		return [suggestionField, ghostPlugin, acceptTab];
	}

	// ─── 5) Initialize CodeMirror on mount ────────────────────────────────────────────

	onMount(async () => {

		titles = await getTitles();
		tags = await getTags();

		const updateListener = EditorView.updateListener.of(update => {
			if (update.docChanged) {
				raw_markdown = update.state.doc.toString();
			}
		});

		const code_mirror_view = new EditorView({
			doc: '',
			extensions: [
				basicSetup,
				updateListener,
				autocompletion({ override: [customAutocomplete] })
			],
			parent: codemirror_element
		});

		if (note_id !== null) {
			const note = await getNote(note_id);
			raw_markdown = note.note_content;
			note_title = note.note_title;
			code_mirror_view.dispatch({
				changes: { from: 0, to: code_mirror_view.state.doc.length, insert: raw_markdown }
			});
		}
	});

	function saveNote() {
		editNote(note_id, note_title, raw_markdown);
	}
</script>

<div class="w-full h-full flex flex-col">
	<div class="flex flex-row pl-2 pr-2 pt-2 space-x-2">
		<Input placeholder="Title" bind:value={note_title} class="w-full" />
		<Button onclick={saveNote}>Save Note</Button>
	</div>
	<Resizable.PaneGroup direction="horizontal">
		<Resizable.Pane defaultSize={50} class="w-full h-full">
			<div bind:this={codemirror_element} class="p-2 space-y-2 w-full h-full overflow-auto"></div>
		</Resizable.Pane>
		<Resizable.Handle class="w-3" />
		<Resizable.Pane defaultSize={50} class="w-full h-full">
			<div class="p-2 w-full h-full prose prose-invert">
				{@html markdown_html}
			</div>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
