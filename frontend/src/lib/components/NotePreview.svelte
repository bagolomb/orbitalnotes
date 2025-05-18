<script>
    let {note} = $props();

</script>

<button onclick={() => {}}>
    <div class="flex flex-col w-full h-24 p-2 card bg-base-300">
        <h1>{note.title}</h1>
        <p>{note.content}</p>
    </div>
</button>
