import { writable } from 'svelte/store';
import type { WebSocketMessage } from '../types/websocket';

export const webSocketMessage = writable<WebSocketMessage | null>(null);