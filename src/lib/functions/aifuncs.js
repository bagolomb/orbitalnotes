import ollama from 'ollama'
import { getSettings } from '$lib/functions/storefuncs.js'

const settings_store = await getSettings();

export async function embed(text, streaming = false) {
    const embed_model = await settings_store.get('embedding_model');
    const response = await ollama.embed({
        model: embed_model,
        text: text,
        streaming: streaming
    });
    return response;
}

export async function chat(messages) {
    const chat_model = await settings_store.get('chat_model');
    const response = await ollama.chat({
        model: chat_model,
        messages: messages
    });
    return response;
}


