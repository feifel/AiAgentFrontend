<script lang="ts">
  import { onDestroy } from "svelte";

  export let base64Audio: string;
  let audioElement: HTMLAudioElement;
  let audioContext: AudioContext | null = null;
  let audioBufferQueue: ArrayBuffer[] = [];
  let isPlaying = false;

  async function initAudioContext() {
    if (!audioContext) {
      audioContext = new AudioContext({
        sampleRate: 24000, // Match the server's sample rate
      });
    }
    return audioContext;
  }

  async function playAudioChunk(audioBuffers: ArrayBuffer[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const ctx = await initAudioContext();
        
        const totalLength = audioBuffers.reduce((acc, buffer) => 
          acc + new Int16Array(buffer).length, 0);
        
        if (totalLength === 0) {
          isPlaying = false;  // Make sure to reset playing state
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
        
        // Convert and smooth the audio data
        for (let i = 0; i < totalLength; i++) {
          channelData[i] = combinedInt16Array[i] / 32768.0;
        }
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        source.onended = () => {
          source.disconnect();
          isPlaying = false;  // Reset playing state when finished
          resolve();
          // Check for more chunks after this one finishes
          if (audioBufferQueue.length > 0) {
            setTimeout(() => processAudioQueue(), 0);
          }
        };

        source.start();
      } catch (error) {
        isPlaying = false;  // Reset playing state on error
        reject(error);
      }
    });
  }

  async function processAudioQueue() {
    if (isPlaying || audioBufferQueue.length === 0) {
      return;
    }
    
    isPlaying = true;
    
    try {
      // Take only the next chunk to play
      const nextChunk = [audioBufferQueue.shift()!];
      await playAudioChunk(nextChunk);
    } catch (error) {
      console.error("Audio playback error:", error);
      isPlaying = false;
    }
  }

  $: if (base64Audio) {
    console.log("Received new audio chunk, queue length:", audioBufferQueue.length);
    // Convert base64 to audio buffer
    const byteCharacters = atob(base64Audio);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    
    // Add to queue and process
    audioBufferQueue.push(byteArray.buffer);
    processAudioQueue();
  }

  onDestroy(() => {
    if (audioContext) {
      audioContext.close();
    }
  });
</script>

<div class="audio-controls">
  <!-- We don't need the audio element anymore as we're using Web Audio API -->
</div>

<style>
  .audio-controls {
    min-height: 54px; /* Preserve layout space */
  }
</style>