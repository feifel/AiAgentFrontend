import { writable, get } from 'svelte/store';
import type { AudioStream, Configuration, Response } from '../types/websocket';
import type { WebSocketService } from '../services/websocket';

// Create a store for the WebSocketService instance
export const wsService = writable<WebSocketService | null>(null);
export const audioStream = writable<AudioStream | null>(null);
export const response = writable<Response | null>(null);
export const configuration = writable<Configuration>({
    type: "Configuration",
    timestamp: Date.now(),
    llm: "gemma3",
    lang: "de",
    processVideoInput: false,
    audioOutput: false,
    systemPrompt: "Du bist eine hilfreiche KI-Assistentin"
});

// Subscribe to configuration updates and propagate it to the server
configuration.subscribe(config => {
    // Only send if wsService is initialized
    const service = get(wsService);
    if (service) {
        service.sendMessage(config);
    }
});