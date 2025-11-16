class AudioPlayerService {
  private audioContext: AudioContext | null = null;
  private audioBufferQueue: ArrayBuffer[] = [];
  private isPlaying = false;

  private async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({
        sampleRate: 22050, // Match the server's sample rate
      });
    }
    return this.audioContext;
  }

  private async playAudioChunk(audioBuffers: ArrayBuffer[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const ctx = await this.initAudioContext();
        
        const totalLength = audioBuffers.reduce((acc, buffer) => 
          acc + new Int16Array(buffer).length, 0);
        
        if (totalLength === 0) {
          this.isPlaying = false;
          return resolve();
        }
        
        const combinedInt16Array = new Int16Array(totalLength);
        let offset = 0;
        
        audioBuffers.forEach(buffer => {
          const int16Data = new Int16Array(buffer);
          combinedInt16Array.set(int16Data, offset);
          offset += int16Data.length;
        });
        
        const audioBuffer = ctx.createBuffer(1, totalLength, 22050);
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
          this.isPlaying = false;
          resolve();
          // Check for more chunks after this one finishes
          if (this.audioBufferQueue.length > 0) {
            setTimeout(() => this.processAudioQueue(), 0);
          }
        };

        source.start();
      } catch (error) {
        this.isPlaying = false;
        reject(error);
      }
    });
  }

  private async processAudioQueue() {
    if (this.isPlaying || this.audioBufferQueue.length === 0) {
      return;
    }
    
    this.isPlaying = true;
    
    try {
      const nextChunk = [this.audioBufferQueue.shift()!];
      await this.playAudioChunk(nextChunk);
    } catch (error) {
      console.error("Audio playback error:", error);
      this.isPlaying = false;
    }
  }

  public processBase64Audio(base64Audio: string) {
    const byteCharacters = atob(base64Audio);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    
    this.audioBufferQueue.push(byteArray.buffer);
    this.processAudioQueue();
  }

  public dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export AudioPlayer as Singleton
export const audioPlayer = new AudioPlayerService();