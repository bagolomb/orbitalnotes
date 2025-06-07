<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  import { getNote } from "$lib/functions/dbfuncs";

  import { Separator } from "$lib/components/ui/separator/index.js";

  import { marked } from "marked";

  let { note_id } = $props();

  let note = $state({
    note_title: "",
    note_content: "",
  });
  onMount(async () => {
    note = await getNote(note_id);
  });
</script>

<a
  class="cursor-pointer dark:hover:bg-zinc-700 hover:bg-zinc-200 rounded h-full"
  href={`/Editor/${note_id}`}
  role="button"
>
  <div class="p-2 border rounded h-64 overflow-y-auto">
    <h1 class="text-2xl text-center text-gray-500">{note.note_title}</h1>
    <Separator />
    <div class="prose">
      {@html marked(note.note_content)}
    </div>
  </div>
</a>
