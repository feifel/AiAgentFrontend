export interface WebSocketMessage {
  timestamp: number;
  sender: 'ai' | 'user';
  mime_type: 'text/plain' | 'audio/pcm' | 'application/interrupt' | 'image/jpeg';
  data: string;
  audioLevel?: number;
}