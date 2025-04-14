<script lang="ts">
  import { onMount, onDestroy, setContext } from "svelte";
  import { writable, get } from "svelte/store";
  import { createWebSocketStore } from '../stores/websocket';
  import type { WebSocketMessage, WebSocketState } from '../stores/websocket';

  export let url: string;

  const webSocketState = writable<WebSocketState>({
    lastMessage: null,
    isConnected: false,
    audioLevel: 0,
    playbackAudioLevel: 0
  });

  let ws: WebSocket | null = null;
  let reconnectTimeout: number | null = null;
  let connectionTimeout: number | null = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_DELAY = 30000;
  const BASE_RECONNECT_DELAY = 5000;

  const audioQueue = writable<WebSocketMessage[]>([]);
  const isAudioPlaying = writable(false);

  const wsStore = createWebSocketStore('ws://localhost:9073');
  setContext('websocket', wsStore);

  const connect = () => {
    if (ws?.readyState === WebSocket.CONNECTING || ws?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connecting or connected");
      return;
    }

    try {
      ws = new WebSocket(url);

      connectionTimeout = window.setTimeout(() => {
        if (ws?.readyState !== WebSocket.OPEN) {
          ws?.close();
          reconnect();
        }
      }, 30000);

      ws.onopen = () => {
        console.log("WebSocket connected");
        webSocketState.update(s => ({ ...s, isConnected: true }));
        reconnectAttempts = 0;
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        webSocketState.update(s => ({ ...s, isConnected: false }));
        reconnect();
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.text) {
            webSocketState.update(s => ({
              ...s,
              lastMessage: {
                timestamp: Date.now(),
                sender: "ai",
                type: "text",
                data: data.text
              }
            }));
          }

          if (data.audio) {
            // Add new audio chunk to queue
            audioQueue.update(queue => [...queue, {
              timestamp: Date.now(),
              sender: "ai",
              type: "text",
              data: data.audio
            }]);

            // Process audio queue if not already playing
            if (!get(isAudioPlaying)) {
              processAudioQueue();
            }
          }
        } catch (error) {
          console.error("Error handling message:", error);
        }
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      reconnect();
    }
  };

  const reconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }

    const delay = Math.min(
      MAX_RECONNECT_DELAY,
      BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts)
    );

    console.log(`Reconnecting in ${delay}ms`);
    reconnectTimeout = window.setTimeout(() => {
      reconnectAttempts++;
      connect();
    }, delay);
  };

  async function processAudioQueue() {
    const queue = get(audioQueue);
    if (queue.length === 0) {
      isAudioPlaying.set(false);
      return;
    }

    isAudioPlaying.set(true);
    const chunk = queue[0];

    // Update store with new audio message
    webSocketState.update(s => ({
      ...s,
      lastMessage: {
        timestamp: Date.now(),
        sender: "ai",
        type: "audio",
        data: chunk.data
      }
    }));

    // Remove processed chunk from queue
    audioQueue.update(queue => queue.slice(1));

    // Wait for a short delay before processing next chunk
    await new Promise(resolve => setTimeout(resolve, 100));

    // Process next chunk if available
    if (get(audioQueue).length > 0) {
      processAudioQueue();
    } else {
      isAudioPlaying.set(false);
    }
  }

  const sendMessage = (message: any) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  onMount(() => {
    connect();
  });

  onDestroy(() => {
    if (ws) {
      ws.close();
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }
  });
</script>

<slot></slot>