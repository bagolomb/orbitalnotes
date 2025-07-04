import { browser } from '$app/environment';
import { $state, $effect } from 'svelte/runes';

export class LocalStore<T> {
  value = $state<T>(undefined as any);
  key: string;

  constructor(key: string, initial: T) {
    this.key = key;
    this.value = initial;

    if (browser) {
      const item = localStorage.getItem(key);
      if (item) this.value = JSON.parse(item);
    }

    $effect(() => {
      localStorage.setItem(this.key, JSON.stringify(this.value));
    });
  }
}

export function localStore<T>(key: string, initial: T) {
  return new LocalStore(key, initial);
}
