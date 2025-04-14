import { writable } from 'svelte/store';

export interface WebSocketState {
  lastMessage: WebSocketMessage | null;
  isConnected: boolean;
  audioLevel: number;
  playbackAudioLevel: number;
}

export interface WebSocketMessage {
  timestamp: number;
  sender: 'ai' | 'user';
  type: 'text' | 'audio' | 'interrupt';
  data: string;
}

interface MediaChunk {
  mime_type: string;
  data: string;
}

export interface WebSocketStore {
  subscribe: any;
  sendMessage: (message: any) => void;
  sendMediaChunk: (chunk: MediaChunk) => void;
  ws: WebSocket | null;
  lastMessage: WebSocketMessage | null;
}

export function createWebSocketStore(url: string): WebSocketStore {
  let ws: WebSocket | null = null;
  let reconnectTimeout: number;
  let connectionTimeout: number;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_DELAY = 30000;
  const INITIAL_RECONNECT_DELAY = 5000;
  const CONNECTION_TIMEOUT = 30000;

  const { subscribe, set, update } = writable({
    ws: null as WebSocket | null,
    lastMessage: null,
    isConnected: false,
    playbackAudioLevel: 0
  });

  function connect() {
    // Don't reconnect if already connecting or connected
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
      console.log("WebSocket already connecting or connected, skipping reconnect");
      return;
    }

    try {
      ws = new WebSocket(url);
      ws.binaryType = 'arraybuffer'; // Enable binary message support

      // Set connection timeout
      connectionTimeout = setTimeout(() => {
        if (ws && ws.readyState !== WebSocket.OPEN) {
          ws.close();
          reconnect();
        }
      }, CONNECTION_TIMEOUT);

      ws.onopen = () => {
        console.log('WebSocket connected');
        clearTimeout(connectionTimeout);
        reconnectAttempts = 0;
        update(state => ({ ...state, ws, isConnected: true }));
        
        // Send initial setup message
        sendMessage({
          setup: {
            // Add any needed config options
          }
        });
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        update(state => ({ ...state, ws: null, isConnected: false }));
        reconnect();
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws?.close();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          update(state => ({ ...state, lastMessage: data }));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      reconnect();
    }
  }

  function reconnect() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }

    const backoffTime = Math.min(
      MAX_RECONNECT_DELAY,
      INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts)
    );
    console.log(`Scheduling reconnect in ${backoffTime}ms`);

    reconnectTimeout = setTimeout(() => {
      reconnectAttempts++;
      connect();
    }, backoffTime);
  }

  function sendMessage(message: any) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected, message not sent');
    }
  }

  function sendMediaChunk(chunk: MediaChunk) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        realtime_input: {
          media_chunks: [chunk]
        }
      }));
    } else {
      console.warn('WebSocket is not connected, media chunk not sent');
    }
  }

  // Start initial connection
  connect();

  return {
    subscribe,
    sendMessage,
    sendMediaChunk,
    ws,
    lastMessage: null
  };
}