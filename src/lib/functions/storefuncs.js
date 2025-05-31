import { load } from '@tauri-apps/plugin-store';

export async function getSettings() {
    const store = await load('settings.json', { autoSave: false });
    return store;
}

export async function initSettings() {
    const store = await getSettings();
    store.set('chat_model', '');
    store.set('completion_model', '');
    store.set('embedding_model', '');
    await store.save();
}

