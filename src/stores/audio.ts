import { writable } from 'svelte/store';

export const receivedAudioData = writable<string | null>(null);
export const audioLevel = writable<number>(0);