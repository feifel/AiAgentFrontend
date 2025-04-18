import type { WebSocketMessage } from '../types/websocket';
import { webSocketMessage } from '../stores/websocket';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: number = 0;
  private connectionTimeout: number = 0;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_DELAY = 30000;
  private readonly INITIAL_RECONNECT_DELAY = 5000;
  private readonly CONNECTION_TIMEOUT = 30000;
  public isConnected = false;

  constructor(private url: string) {
    this.connect();
  }

  private connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log("WebSocket already connecting or connected, skipping reconnect");
      return;
    }

    try {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';

      this.connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          this.ws.close();
          this.reconnect();
        }
      }, this.CONNECTION_TIMEOUT);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        clearTimeout(this.connectionTimeout);
        this.reconnectAttempts = 0;
        this.isConnected = true;
        
        this.sendMessage({
          setup: {}
        });
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.ws = null;
        this.isConnected = false;
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.ws?.close();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { data, ...msgWithoutData } = msg;
          console.log('Received WebSocket message for propagation:', msgWithoutData);
          msg.timestamp = Date.now();
          webSocketMessage.set(msg);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.reconnect();
    }
  }

  private reconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const backoffTime = Math.min(
      this.MAX_RECONNECT_DELAY,
      this.INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts)
    );
    console.log(`Scheduling reconnect in ${backoffTime}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, backoffTime);
  }

  public sendMessage(message: WebSocketMessage | any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected, message not sent');
    }
  }

  public dispose() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    this.ws?.close();
  }
}