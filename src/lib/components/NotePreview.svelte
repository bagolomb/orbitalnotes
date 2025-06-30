<script>
    import { onMount } from "svelte";

    import { getNote, deleteNote } from "$lib/functions/dbfuncs";

    import { Separator } from "$lib/components/ui/separator/index.js";

    import { marked } from 'marked';
    marked.use({
      gfm: true,
      breaks: true,
  });

    import { Trash } from 'lucide-svelte';


    let { note_id } = $props();

    let note = $state({
        note_title: '',
        note_content: ''
    });
    onMount(async () => {
        note = await getNote(note_id);
    });
</script>

<a
  class="relative cursor-pointer dark:hover:bg-zinc-700 hover:bg-zinc-200 rounded h-full"
  href={`/editor/${note_id}`}
  role="button"
>
  <!-- Delete button -->
  <button
    onclick={(event) => {
      event.stopPropagation();
      event.preventDefault(); // ← this is the missing piece
      deleteNote(note_id);
    }}
    class="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-white dark:bg-zinc-800 rounded-full p-1 shadow"
    aria-label="Delete"
    >
        <Trash />
    </button>

  <!-- Note content -->
  <div class="p-2 border rounded h-64 overflow-y-auto">
    <h1 class="text-2xl text-center text-gray-500">{note.note_title}</h1>
    <Separator />
    <div class="prose">
      {@html marked(note.note_content)}
    </div>
  </div>
</a>
