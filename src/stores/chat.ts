import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { response } from './websocket';
import type { Response, Request } from '../types/websocket';

export interface ChatMessage {
  timestamp: number;
  sender: string;
  text: string;
  id: number;
}

export const chatEnabled = writable(true);
export const chatMessages = writable<ChatMessage[]>([]);

// Subscribe to response updates and add messages to chat
response.subscribe(responseData => {
  addMessage(responseData);
});

/**
 * Processes response data and adds it as a new message to the chat store.
 * @param responseData - The data received from the response.
 */
export function addMessage(responseData: Response | Request | null): void {
  // Check if responseData and its data property are valid
  if (responseData && responseData.data) {
    // Create a new chat message from the response
    const newMessage: ChatMessage = {
      timestamp: responseData.timestamp,
      sender: responseData.context, // Assuming context maps to sender
      text: responseData.data,
      id: get(chatMessages).length // Generate ID based on current length
    };

    // Add the new message to the chatMessages store
    chatMessages.update(messages => [...messages, newMessage]);
  }
}
