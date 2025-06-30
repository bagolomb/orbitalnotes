import ollama from 'ollama/browser'
import { getSettings } from '$lib/functions/storefuncs.js'



export async function embed(text) {
    let settings_store = await getSettings();
    const embed_model = await settings_store.get('embedding_model');

    const response = await ollama.embed({
        model: embed_model,
        input: text,
    });
    return response;
}

export async function chat(messages, streaming = false) {
    let settings_store = await getSettings();
    const chat_model = await settings_store.get('chat_model');
    const response = await ollama.chat({
        model: chat_model,
        messages: messages,
        stream: streaming
    });
    return response;
}

export async function generate(prefix, suffix) {
	let settings_store = await getSettings();
	const completion_model = await settings_store.get('completion_model');

	// Returns an async iterable, not a ReadableStream
	const stream = await ollama.generate({
		model: completion_model,
		prompt: prefix,
		suffix: suffix,
		system: "/no_think You are an autocomplete assistant for a markdown notes app. Make a suggestion for the note. Do not ask questions. Do not repeat the input. Just make a short suggestion with nothing else outputted",
		stream: true,
        think: false
	});
	return stream; // This is async iterable
}

export async function generateSummary(text) {
    let settings_store = await getSettings();
    const chat_model = await settings_store.get('chat_model');
    const response = await ollama.chat({
        model: chat_model,
        messages: [
            { role: "system", content: "/no_think Summarize the following markdown note clearly. Only repsond with the summary and nothing else" },
            { role: "user", content: text }
        ],
        stream: false,
        think: false
    });
    return response;
}


