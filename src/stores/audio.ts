import { writable } from 'svelte/store';
import { audioStream } from './websocket';

export const receivedAudioData = writable<string | null>(null);
export const audioLevel = writable<number>(0);
export const microphoneEnabled = writable(false);

// Subscribe to audioStream updates and propagate it to receivedAudioData
audioStream.subscribe(audioStream => {
  if (audioStream && audioStream.data) {
    console.log('Received audio data...');
    receivedAudioData.set(audioStream.data);
  }
});
