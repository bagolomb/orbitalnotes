<script>
    let { data } = $props();

    import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
</script>

<MarkdownEditor note_id={data.note_id} />
