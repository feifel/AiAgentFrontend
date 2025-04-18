// Base interface for all WebSocket packages
export interface WebSocketMessage {
  readonly type: 'InterruptAudio' | 'ScreenShot' | 'AudioStream' | 'STTRequest' | 'Request' | 'Response';
  readonly timestamp: number;     // Date.now()
  //readonly version: '1.0';       // For future protocol versioning
  //readonly messageId: string;    // For request/response correlation
}

// InterruptAudio Message, to interrupt audio output when new Audio Input is detected
export interface InterruptAudio extends WebSocketMessage {
  readonly type: 'InterruptAudio';
}

// ScreenShot message
export interface ScreenShot extends WebSocketMessage {
  readonly type: 'ScreenShot';
  readonly data: string;           // Base64-encoded-data
  readonly mimeType?: 'image/jpeg';// Only only "image/jpeg"
}

// AudioStream message
export interface AudioStream extends WebSocketMessage {
  readonly type: 'AudioStream';
  readonly data: string;           // Base64-encoded-data
  readonly mimeType?: 'audio/pcm'; // Currently only "audio/pcm"
}

// SSTRequest message
export interface STTRequest extends WebSocketMessage {
  readonly type: 'STTRequest';
  readonly data: string;           // The user prompt in plain text
  readonly context: string;        // The context will be returned with the response
}

// Request message
export interface Request extends WebSocketMessage {
  readonly type: 'Request';
  readonly data: string;           // The user prompt in plain text
  readonly context: string;        // The context will be returned with the response
  readonly files?: File[];         // Optional array of files
}

// Response message
export interface Response extends WebSocketMessage {
  readonly type: 'Response';
  readonly data: string;
  readonly mimeType: 'text/plain' | 'text/markdown';
  readonly context: string;        // The context copied from the request
  readonly files?: File[];         // Optional array of files
  readonly error?: {               // Optional error object
      code: number;
      message: string;
  };
}

// Interface for attached files
export interface File {
  readonly name: string;           // The file name
  readonly data: string;           // Base64-encoded-data
  readonly size?: number;          // Original file size in bytes (optional)
  readonly encoding: 'base64';     // Explicit encoding
}