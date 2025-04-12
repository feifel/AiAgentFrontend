<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import { Base64 } from 'js-base64';

  export let url: string;

  interface MediaChunk {
    mime_type: string;
    data: string;
  }

  interface AudioChunkBuffer {
    data: ArrayBuffer[];
    startTimestamp: number;
  }

  // Constants
  const RECONNECT_TIMEOUT = 5000;
  const CONNECTION_TIMEOUT = 30000;
  const AUDIO_BUFFER_DURATION = 2000;
  const LOOPBACK_DELAY = 3000;

  // Store creation with TypeScript interface
  interface WebSocketStore {
    isConnected: boolean;
    lastMessage: string | null;
    lastAudioData: string | null;
    playbackAudioLevel: number;
    sendMessage: (message: any) => void;
    sendMediaChunk: (chunk: MediaChunk) => void;
    sendBinary: (data: ArrayBuffer) => void;
  }

  const createWebSocketStore = () => {
    const { subscribe, set, update } = writable<WebSocketStore>({
      isConnected: false,
      lastMessage: null,
      lastAudioData: null,
      playbackAudioLevel: 0,
      sendMessage: () => {},
      sendMediaChunk: () => {},
      sendBinary: () => {}
    });

    return {
      subscribe,
      set,
      update,
      setConnected: (status: boolean) => update(store => ({ ...store, isConnected: status })),
      setLastMessage: (message: string) => update(store => ({ ...store, lastMessage: message })),
      setLastAudioData: (audio: string) => update(store => ({ ...store, lastAudioData: audio })),
      setPlaybackLevel: (level: number) => update(store => ({ ...store, playbackAudioLevel: level })),
      sendMessage: (message: any) => update(store => ({ ...store, sendMessage: () => sendMessage(message) })),
      sendMediaChunk: (chunk: MediaChunk) => update(store => ({ ...store, sendMediaChunk: () => sendMediaChunk(chunk) })),
      sendBinary: (data: ArrayBuffer) => update(store => ({ ...store, sendBinary: () => sendBinary(data) }))
    };
  };

  const websocketStore = createWebSocketStore();
  export const websocket = { ...websocketStore };

  // WebSocket and Audio context references
  let ws: WebSocket;
  let audioContext: AudioContext | null = null;
  let audioBufferQueue: AudioChunkBuffer[] = [];
  let currentChunk: AudioChunkBuffer | null = null;
  let audioSource: AudioBufferSourceNode | null = null;
  let reconnectTimeout: NodeJS.Timeout;
  let connectionTimeout: NodeJS.Timeout;
  let reconnectAttempts = 0;
  let isPlaybackActive = false;

  // Initialize audio context
  const initAudioContext = () => {
    if (!audioContext) {
      audioContext = new AudioContext({
        sampleRate: 24000
      });
    }
    return audioContext;
  };

  // WebSocket connection handling
  const connect = () => {
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
      console.log("WebSocket already connecting or connected, skipping reconnect");
      return;
    }

    try {
      ws = new WebSocket(url);
      ws.binaryType = 'arraybuffer';

      // Set connection timeout
      connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          reconnect();
        }
      }, CONNECTION_TIMEOUT);

      ws.onopen = () => {
        websocketStore.setConnected(true);
        clearTimeout(connectionTimeout);
        reconnectAttempts = 0;
        
        // Send initial setup message
        console.log("WebSocket connected, sending initial setup");
        sendMessage({
          setup: {
            // Add any needed config options
          }
        });
      };

      ws.onclose = () => {
        websocketStore.setConnected(false);
        reconnect();
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received websocket data:', data);
          
          if (data.interrupt) {
            console.log('[WebSocket] Received interrupt signal:', data);
            stopAndClearAudio();
            return;
          }

          // Update lastMessage in the store
          websocketStore.update(state => ({
            ...state,
            lastMessage: data
          }));

          if (data.text) {
            websocketStore.setLastMessage(data.text);
          }
          
          if (data.audio) {
            console.log('[WebSocket] Received audio data:', data.audio);
            websocketStore.setLastAudioData(data.audio);
            
            const audioBuffer = Base64.toUint8Array(data.audio);
            const now = Date.now();
            
            const newChunk: AudioChunkBuffer = {
              data: [audioBuffer.buffer as ArrayBuffer],
              startTimestamp: now
            };
            
            audioBufferQueue.push(newChunk);
            processAudioQueue();
          }
        } catch (error) {
          console.error('Error handling message:', error);
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      reconnect();
    }
  };

  const reconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    
    const backoffTime = Math.min(30000, RECONNECT_TIMEOUT * (reconnectAttempts || 1));
    console.log(`Scheduling reconnect in ${backoffTime}ms`);
    
    reconnectTimeout = setTimeout(() => {
      reconnectAttempts++;
      connect();
    }, backoffTime);
  };

  // Audio processing
  const processAudioQueue = async () => {
    if (isPlaybackActive || audioBufferQueue.length === 0) {
      return;
    }
    
    isPlaybackActive = true;
    console.log('[Audio] Starting playback of queued chunks');
    
    try {
      const allChunks = [...audioBufferQueue];
      audioBufferQueue = [];
      
      console.log(`[Audio] Processing ${allChunks.length} chunks for playback`);
      
      const allBuffers: ArrayBuffer[] = [];
      allChunks.forEach(chunk => {
        allBuffers.push(...chunk.data);
      });
      
      await playAudioChunk(allBuffers);
      
      if (audioBufferQueue.length > 0) {
        console.log('[Audio] More chunks arrived during playback, continuing');
        processAudioQueue();
      }
    } catch (error) {
      console.error("[Audio] Error in audio playback:", error);
    } finally {
      isPlaybackActive = false;
      console.log('[Audio] Playback completed');
    }
  };

  const playAudioChunk = async (audioBuffers: ArrayBuffer[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const ctx = initAudioContext();
        
        const totalLength = audioBuffers.reduce((acc, buffer) => 
          acc + new Int16Array(buffer).length, 0);
        
        if (totalLength === 0) {
          return resolve();
        }
        
        const combinedInt16Array = new Int16Array(totalLength);
        let offset = 0;
        
        audioBuffers.forEach(buffer => {
          const int16Data = new Int16Array(buffer);
          combinedInt16Array.set(int16Data, offset);
          offset += int16Data.length;
        });
        
        const audioBuffer = ctx.createBuffer(1, totalLength, 24000);
        const channelData = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < totalLength; i++) {
          channelData[i] = combinedInt16Array[i] / 32768.0;
        }
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        audioSource = source;

        source.onended = () => {
          source.disconnect();
          if (audioSource === source) {
            audioSource = null;
          }
          resolve();
        };

        source.start();
      } catch (error) {
        reject(error);
      }
    });
  };

  const stopAndClearAudio = () => {
    console.log('[Audio] Stopping and clearing all audio');
    if (audioSource) {
      console.log('[Audio] Stopping current audio source');
      try {
        audioSource.stop();
        audioSource.disconnect();
        audioSource = null;
      } catch (error) {
        console.error('[Audio] Error stopping audio:', error);
      }
    } else {
      console.log('[Audio] No current audio source to stop');
    }
    
    const queueLength = audioBufferQueue.length;
    audioBufferQueue = [];
    currentChunk = null;
    console.log(`[Audio] Cleared audio queue (${queueLength} chunks removed)`);
  };

  // Message sending functions
  const sendMessage = (message: any) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  const sendMediaChunk = (chunk: MediaChunk) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        realtime_input: {
          media_chunks: [chunk]
        }
      }));
    }
  };

  const sendBinary = (data: ArrayBuffer) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  };

  // Lifecycle hooks
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
    if (audioContext) {
      audioContext.close();
    }
    stopAndClearAudio();
  });

  // Export functions and store to be used by other components
  websocket.sendMessage = sendMessage;
  websocket.sendMediaChunk = sendMediaChunk;
  websocket.sendBinary = sendBinary;
</script>

<slot />