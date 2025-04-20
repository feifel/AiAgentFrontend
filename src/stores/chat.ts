import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { response } from './websocket';

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
  if (responseData && responseData.data) {    
    // Create a new chat message from the response
    const newMessage: ChatMessage = {
      timestamp: responseData.timestamp,
      sender: responseData.context,
      text: responseData.data,
      id: get(chatMessages).length
    };
    
    // Add the new message to chat messages
    chatMessages.update(messages => [...messages, newMessage]);
  }
});
