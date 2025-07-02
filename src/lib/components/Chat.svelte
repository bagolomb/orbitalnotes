<script>
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import * as Collapsible from "$lib/components/ui/collapsible/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { ChevronsUpDown } from "lucide-svelte";
  import { marked } from "marked";
  import { chat } from "$lib/functions/aifuncs.js";
  import { search, getNote } from "$lib/functions/dbfuncs.js";

  let prompt_input = $state("");
  let chat_history = $state([]);
  let visible_chat_history = $state([]);
  let system_message = $state([
    {
      role: "system",
      content:
        "You are a helpful retrieval augmented generation assistant and always answer in markdown format. You may use the notes for extra knowledge but do not let the user think they directly shared them and answer in 150 words",
    },
  ]);

  async function submit() {
    const rag_note_ids = await search(prompt_input);

    let rag_content = "";
    for (const note_id of rag_note_ids) {
      const note = await getNote(note_id);
      rag_content +=
        "\n\nnote_title: " +
        note.note_title +
        "\nnote_content: \n" +
        note.note_content;
    }

    visible_chat_history.push({
      role: "user",
      content: prompt_input,
    });

    chat_history.push({
      role: "user",
      content:
        prompt_input + "\n\nHere are my notes for reference: \n" + rag_content,
    });

    prompt_input = "";

    const assistantMessage = $state({
      role: "assistant",
      thought: "",
      content: "",
      renderedHtml: "",
      isStreaming: true,
    });

    visible_chat_history.push(assistantMessage);
    chat_history.push(assistantMessage);

    // Separate buffers for better control
    let thoughtBuffer = "";
    let contentBuffer = "";
    let fullBuffer = "";
    let isInThinkBlock = false;

    const messages_to_send = [...system_message, ...chat_history];

    try {
      const response_stream = await chat(messages_to_send, true);

      for await (const chunk of response_stream) {
        const chunk_text = chunk.message.content;
        fullBuffer += chunk_text;

        // Check for think block start
        if (!isInThinkBlock && fullBuffer.includes("<think>")) {
          const thinkStartIndex = fullBuffer.indexOf("<think>");
          // Content before <think> goes to content
          contentBuffer += fullBuffer.substring(0, thinkStartIndex);
          fullBuffer = fullBuffer.substring(thinkStartIndex + "<think>".length);
          isInThinkBlock = true;
        }

        // Check for think block end
        if (isInThinkBlock && fullBuffer.includes("</think>")) {
          const thinkEndIndex = fullBuffer.indexOf("</think>");
          // Content inside think block
          thoughtBuffer += fullBuffer.substring(0, thinkEndIndex);
          // Content after </think>
          fullBuffer = fullBuffer.substring(thinkEndIndex + "</think>".length);
          contentBuffer += fullBuffer;
          fullBuffer = ""; // Clear buffer since we processed everything
          isInThinkBlock = false;
        } else if (isInThinkBlock) {
          // We're inside a think block, add to thought
          thoughtBuffer += chunk_text;
        } else {
          // We're outside think blocks, add to content
          contentBuffer += chunk_text;
        }

        // Update the message object
        assistantMessage.thought = thoughtBuffer;
        assistantMessage.content = contentBuffer;

        // For streaming display, show raw content
        // Don't render HTML until streaming is complete
      }

      assistantMessage.isStreaming = false;

      if (assistantMessage.content.trim()) {
        try {
          let sanitized = assistantMessage.content.trim();

          // Remove leading/trailing code fences (``` or ```markdown)
          sanitized = sanitized.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, "$1");
          console.log(sanitized)
          assistantMessage.renderedHtml = await marked.parse(sanitized);
        } catch (markdownError) {
          console.error("Markdown parsing error:", markdownError);
          assistantMessage.renderedHtml = assistantMessage.content.replace(
            /\n/g,
            "<br>"
          );
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      assistantMessage.isStreaming = false;
      assistantMessage.content =
        "Sorry, there was an error processing your request.";
      assistantMessage.renderedHtml = assistantMessage.content;
    }
  }
</script>

<div class="flex flex-col w-full h-full">
  <div class="flex flex-col flex-grow w-full h-full space-y-2 overflow-hidden">
    <ScrollArea class="flex flex-col flex-grow h-full p-4 min-h-0">
      <div class="flex flex-col space-y-2 w-full">
        {#each visible_chat_history as message}
          {#if message.role === "user"}
            <div class="flex justify-end w-full">
              <div class="max-w-[70%] min-w-0">
                <Card.Root class="!py-0 !gap-0">
                  <Card.Content class="p-3 break-words overflow-hidden">
                    <div class="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </Card.Content>
                </Card.Root>
              </div>
            </div>
          {:else if message.role === "assistant"}
            <div class="flex justify-start w-full">
              <div class="max-w-[70%] min-w-0">
                <Card.Root class="!py-0 !gap-0 text-wrap">
                  <Card.Content
                    class="p-3 break-words overflow-hidden text-wrap"
                  >
                    {#if message.thought}
                      <Collapsible.Root class="text-muted-foreground text-sm">
                        <Collapsible.Trigger>
                          <div class="flex items-center gap-2">
                            <h1>Thoughts</h1>
                            <ChevronsUpDown />
                          </div>
                        </Collapsible.Trigger>
                        <Collapsible.Content class="break-words text-wrap">
                          <div
                            class="whitespace-pre-wrap break-words text-wrap"
                          >
                            {message.thought}
                          </div>
                        </Collapsible.Content>
                      </Collapsible.Root>
                    {/if}

                    {#if message.content}
                      {#if message.isStreaming}
                        <!-- Show raw content while streaming -->
                        <div class="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      {:else}
                        <!-- Show rendered HTML after streaming is complete -->
                        <div
                          class="prose prose-sm prose-invert mt-2 max-w-full sm:max-w-2xl break-words
                                overflow-visible h-auto min-h-0
                                [&_pre]:overflow-x-auto [&_pre]:max-w-full
                                [&_code]:break-words [&_h1]:break-words [&_h2]:break-words
                                [&_h3]:break-words [&_p]:break-words text-wrap whitespace-pre-wrap"
                        >
                          {@html message.renderedHtml}
                        </div>
                      {/if}
                    {/if}
                  </Card.Content>
                </Card.Root>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </ScrollArea>
  </div>

  <Card.Root class="y-0">
    <Card.Content class="flex justify-center items-center gap-2 w-[100%]">
      <Textarea
        bind:value={prompt_input}
        class="resize-none rounded-[50px] max-w-[70vw] min-h-[10vh] field-sizing-content max-h-[20vh] scroll-auto no-scroll p-6"
        onkeydown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <Button class="rounded-[50px]" onclick={submit}>Send</Button>
    </Card.Content>
  </Card.Root>
</div>
