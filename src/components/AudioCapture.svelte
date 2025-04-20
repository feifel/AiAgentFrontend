<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { Base64 } from 'js-base64';
    import type { WebSocketService } from '../services/websocket';
    import { audioLevel, microphoneEnabled } from '../stores/audio';

    export let wsHandler: WebSocketService;

    interface AudioStats {
        rms: number;
        maxAmplitude: number;
        bufferSize: number;
    }

    let audioContext: AudioContext | null = null;
    let audioStream: MediaStream | null = null;
    let audioWorkletNode: AudioWorkletNode | null = null;
    let audioStats: AudioStats | null = null;
    let isCapturing = false;

    // Subscribe to microphoneEnabled changes
    $: if ($microphoneEnabled && !isCapturing) {
        startAudioCapture();
    } else if (!$microphoneEnabled && isCapturing) {
        stopAudioCapture();
    }

    async function startAudioCapture() {
        if (isCapturing) return;

        try {
            console.log('Starting audio capture...');
            
            const userAudioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                    sampleRate: 24000
                }
            });
            console.log('Audio stream obtained successfully with settings:', {
                channelCount: userAudioStream.getAudioTracks()[0].getSettings().channelCount,
                sampleRate: userAudioStream.getAudioTracks()[0].getSettings().sampleRate
            });

            // Store the audio stream for later cleanup
            audioStream = userAudioStream;

            audioContext = new AudioContext({
                sampleRate: 24000,
                latencyHint: 'interactive'
            });

            console.log('Loading audio worklet module...');
            await audioContext.audioWorklet.addModule('/worklets/audio-processor.js');
            console.log('Audio worklet module loaded successfully');
            
            const source = audioContext.createMediaStreamSource(userAudioStream);
            audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor', {
                numberOfInputs: 1,
                numberOfOutputs: 1,
                processorOptions: {
                    sampleRate: 24000,
                    bufferSize: 4096,
                },
                channelCount: 1,
                channelCountMode: 'explicit',
                channelInterpretation: 'speakers'
            });

            audioWorkletNode.port.onmessage = (event) => {
                const { pcmData, level, stats } = event.data;
                audioLevel.set(level);
                audioStats = stats;
                
                if (pcmData) {
                    const base64Data = Base64.fromUint8Array(new Uint8Array(pcmData));
                    wsHandler.sendMessage({
                        type: 'AudioStream',
                        timestamp: Date.now(),
                        data: base64Data,
                        mimeType: 'audio/pcm'
                    });
                }
            };

            source.connect(audioWorkletNode);
            console.log('Audio processing pipeline connected');
            isCapturing = true;
            console.log('Audio capture started successfully');
        } catch (err) {
            console.error('Failed to start audio capture:', err);
            stopAudioCapture();
        }
    }

    function stopAudioCapture() {
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }

        if (audioWorkletNode) {
            audioWorkletNode.disconnect();
            audioWorkletNode = null;
        }
        
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }

        isCapturing = false;
        audioLevel.set(0);
        console.log('Audio capture stopped');
    }

    onDestroy(() => {
        stopAudioCapture();
    });
</script>

{#if $microphoneEnabled}
  <div class="audio-level">
    <div 
      class="audio-level-indicator" 
      style="width: {$audioLevel}%"
    ></div>
  </div>
{/if}

<style>
  .audio-level {
    width: 100%;
    background-color: var(--audio-level-bg, #333333);
    border-radius: 2px;
  }

  .audio-level-indicator {
    height: 100%;
    background-color: var(--audio-level-indicator, #3b82f6);
    border-radius: 2px;
    transition: width 0.1s ease;
  }
</style>