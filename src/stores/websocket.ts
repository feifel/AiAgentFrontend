import { writable, get } from 'svelte/store';
import type { AudioStream, Configuration, Response } from '../types/websocket';
import type { WebSocketService } from '../services/websocket';
import { defaultConfig } from '../config/app-config';

// Create a store for the WebSocketService instance
export const wsService = writable<WebSocketService | null>(null);
export const audioStream = writable<AudioStream | null>(null);
export const response = writable<Response | null>(null);
export const configuration = writable<Configuration>({
    type: "Configuration",
    timestamp: Date.now(),
    llm: defaultConfig.llm,
    lang: defaultConfig.lang,
    processVideoInput: false,
    audioOutput: defaultConfig.audioOutput,
    systemPrompt: defaultConfig.systemPrompt
});

// Subscribe to configuration updates and propagate it to the server
configuration.subscribe(config => {
    // Only send if wsService is initialized
    const service = get(wsService);
    if (service) {
        service.sendMessage(config);
    }
});