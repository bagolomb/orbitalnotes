import { load } from '@tauri-apps/plugin-store';

export async function getSettings() {
    const store = await load('settings.json', { autoSave: false });
    return store;
}


export async function getTodo() {
    const store = await load('todo.json', { autoSave: false });
    return store;
}


