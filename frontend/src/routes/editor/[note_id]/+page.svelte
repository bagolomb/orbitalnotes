<script>
    import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
    let {note_id} = $props();
</script>
<div class="flex flex-row h-full w-full p-2">
    <MarkdownEditor {note_id} />
</div>