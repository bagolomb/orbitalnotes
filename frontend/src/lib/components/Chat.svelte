<script>
    import { marked } from 'marked';
    let prompt_input = $state("");
    let messages = $state([]);
    let loading = $state(false);

    async function sendMessage() {
        messages.push({
            role: "user",
            content: prompt_input
        });
        let prompt_temp = prompt_input
        prompt_input = "";

        messages.push({
            role: "ai",
        content: "loading..."})
        let response = await fetch('http://127.0.0.1:8000/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt_temp })
        });
        console.log(response)

        let {content} = await response.json();
        console.log(content)
        messages.pop()
        messages.push({
            role: "ai",
            content: content
        });
        
    }

</script>

<div class="flex flex-col h-full w-full p-2">
    <div class="w-full h-full border-2 rounded-2xl p-2">
        {#each messages as message}
            {#if message.role == "user"}
                <div class="chat chat-end">
                    <div class="chat-bubble">
                        {message.content}
                    </div>
                </div>
            {:else}
                <div class="chat chat-start">
                    <div class="chat-bubble">
                        {@html marked.parse(message.content)}
                    </div>
                </div>
            {/if}
        {/each}

    </div>
    <div class="w-full flex items-center justify-center p-2">
        <input type="text" bind:value={prompt_input} class="input"/>
        <button class="btn btn-soft" onclick={sendMessage}>Send</button>
    </div>
    
</div>