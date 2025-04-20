import { writable, get } from 'svelte/store';
import type { AudioStream, Response } from '../types/websocket';

export const audioStream = writable<AudioStream | null>(null);
export const response = writable<Response | null>(null);
