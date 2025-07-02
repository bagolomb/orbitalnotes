<script>
    import { Textarea } from "$lib/components/ui/textarea/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
    import * as Collapsible from "$lib/components/ui/collapsible/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { ChevronsUpDown } from 'lucide-svelte';
    import { marked } from 'marked';
    import { chat } from "$lib/functions/aifuncs.js"
    import { search, getNote } from "$lib/functions/dbfuncs.js"
    let prompt_input = $state("");
    let chat_history = $state([]);
    let visible_chat_history = $state([]);
    let system_message = $state([
            {
                role: "system",
                content: "You are a helpful retrieval augmented generation assistant who outputs in markdown format. You may use the notes for extra knowledge but do not let the user think they directly shared them and answer in 250 words"
            },
        ]);
    async function submit() {
        const rag_note_ids = await search(prompt_input);
        
        let rag_content = "";
        for (const note_id of rag_note_ids) {
            const note = await getNote(note_id);
            rag_content += "\n\nnote_title: " + note.note_title + "\nnote_content: \n" + note.note_content;
        }
        visible_chat_history.push({
            role: "user",
            content: prompt_input
        });
        chat_history.push({
            role: "user",
            content: prompt_input + "\n\nHere are my notes for reference: \n" + rag_content
        });
        prompt_input = "";
        const assistantMessage = $state({
            role: "assistant",
            thought: "",
            content: ""
        });
        visible_chat_history.push(assistantMessage);
        chat_history.push(assistantMessage);
        let is_thinking = false;
        let buffer = "";
        const messages_to_send = [
            ...system_message,
            ...chat_history
        ]
        const response_stream = await chat(messages_to_send, true);
        for await (const chunk of response_stream) {
            let chunk_text = chunk.message.content;
            buffer += chunk_text;
            
            if (is_thinking) {
                assistantMessage.thought += chunk_text;
            }
            else {
                assistantMessage.content += chunk_text;
            }
            if (buffer.includes("<think>")) {
                is_thinking = true;
                const startTagIndex = buffer.indexOf("<think>");
                assistantMessage.content = "";
                buffer = buffer.slice(startTagIndex + "<think>".length);
            }
            if (buffer.includes("</think>")) {
                is_thinking = false;
                const endTagIndex = buffer.indexOf("</think>");
                buffer = buffer.slice(0,endTagIndex);
                assistantMessage.thought = buffer;
                
            }
        }
    }
</script>

<div class="flex flex-col w-full h-full">
    <div class="flex flex-col flex-grow w-full h-full space-y-2 overflow-hidden">
        <ScrollArea class="flex flex-col flex-grow h-full p-4">
            <div class="flex flex-col space-y-2 w-full">
                {#each visible_chat_history as message}
                    {#if message.role === "user"}
                        <div class="flex justify-end w-full">
                            <Card.Root class="max-w-[70%] w-fit">
                                <Card.Content class="p-3">
                                    {message.content}
                                </Card.Content>
                            </Card.Root>
                        </div>
                    {:else if message.role === "assistant"}
                        <div class="flex justify-start w-full">
                            <Card.Root class="max-w-[70%] w-fit">
                                <Card.Content class="p-3">
                                    {#if message.thought}
                                        <Collapsible.Root class="text-muted-foreground text-sm">
                                            <Collapsible.Trigger>
                                                <div class="flex items-center gap-2">
                                                    <h1>Thoughts</h1>
                                                    <ChevronsUpDown />
                                                </div>
                                            </Collapsible.Trigger>
                                            <Collapsible.Content>{message.thought}</Collapsible.Content>
                                        </Collapsible.Root>
                                    {/if}
                                    {#if message.content}
                                        <div class="prose prose-sm prose-invert mt-2">
                                            {@html marked.parse(message.content)}
                                        </div>
                                    {/if}
                                </Card.Content>
                            </Card.Root>
                        </div>
                    {/if}
                {/each}
            </div>
        </ScrollArea>
    </div>
    <Card.Root>
        <Card.Content class="flex justify-center items-center gap-2 w-[100%]">
            <Textarea 
                bind:value={prompt_input} 
                class="resize-none rounded-[50px] w-[50%]" 
                onkeydown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        submit()
                    }
                }} 
            />
            <Button class="rounded-[50px]" onclick={submit}>Send</Button>
        </Card.Content>
    </Card.Root>
</div>