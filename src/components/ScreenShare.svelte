<script lang="ts">
    import { onDestroy } from 'svelte';
    import { Base64 } from 'js-base64';
    import type { WebSocketService } from '../services/websocket';
    import { webSocketMessage } from '../stores/websocket';
    import { audioLevel, receivedAudioData} from '../stores/audio';
    import type { AudioStream } from '../types/websocket';

    export let wsHandler: WebSocketService;

    interface AudioStats {
        rms: number;
        maxAmplitude: number;
        bufferSize: number;
    }

    let isSharing = false;
    let videoRef: HTMLVideoElement;
    let audioContext: AudioContext | null = null;
    let audioStream: MediaStream | null = null;
    let audioWorkletNode: AudioWorkletNode | null = null;
    let captureInterval: ReturnType<typeof setInterval>;
    let audioStats: AudioStats | null = null;


    $: if ($webSocketMessage) {
        console.log('Check if received message is audio data...');
        // Handle incoming Audio data      
        if ($webSocketMessage.type === 'AudioStream') {
            console.log('Received audio data...');
            const audioMsg = $webSocketMessage as AudioStream;
            receivedAudioData.set(audioMsg.data);
        }
    };

    async function startSharing() {
        if (isSharing) return;

        try {
            console.log('Starting screen and audio sharing...');
            
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false
            });
            console.log('Screen stream obtained successfully');
            
            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                    sampleRate: 24000
                }
            });
            console.log('Audio stream obtained successfully with settings:', {
                channelCount: audioStream.getAudioTracks()[0].getSettings().channelCount,
                sampleRate: audioStream.getAudioTracks()[0].getSettings().sampleRate
            });

            audioContext = new AudioContext({
                sampleRate: 24000,
                latencyHint: 'interactive'
            });

            console.log('Loading audio worklet module...');
            await audioContext.audioWorklet.addModule('/worklets/audio-processor.js');
            console.log('Audio worklet module loaded successfully');
            
            const source = audioContext.createMediaStreamSource(audioStream);
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

            if (videoRef) {
                videoRef.srcObject = screenStream;
                console.log('Video stream connected to video element');
                
                captureInterval = setInterval(() => {
                    if (videoRef) {
                        console.log('Capturing screen frame...');
                        const canvas = document.createElement('canvas');
                        canvas.width = videoRef.videoWidth;
                        canvas.height = videoRef.videoHeight;
                        
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(videoRef, 0, 0);
                            const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                            wsHandler.sendMessage({
                                type: 'ScreenShot',
                                timestamp: Date.now(),
                                data: imageData,                                
                                mimeType: 'image/jpeg'
                            });
                        }
                    }
                }, 3000);
            }
            isSharing = true;
            console.log('Screen and audio sharing started successfully');
        } catch (err) {
            console.error('Failed to start sharing:', err);
            stopSharing();
        }
    }

    function stopSharing() {
        if (videoRef?.srcObject) {
            const stream = videoRef.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.srcObject = null;
        }

        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }

        if (captureInterval) {
            clearInterval(captureInterval);
        }

        if (audioWorkletNode) {
            audioWorkletNode.disconnect();
            audioWorkletNode = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }

        isSharing = false;
        audioLevel.set(0);
    }

    onDestroy(() => {
        stopSharing();
    });
</script>

<div class="screen-share-container">
    <div class="video-container">
        <div class="video-wrapper">
            <video
                bind:this={videoRef}
                autoplay
                playsinline
                muted
                class="video-preview"
            ></video>
            
            {#if !isSharing}
                <button 
                    class="btn {wsHandler.isConnected ? 'btn-primary' : 'btn-disabled'}"
                    on:click={startSharing}
                    disabled={!wsHandler.isConnected}
                >
                    {wsHandler.isConnected ? "Start Screen Share" : "Connecting to server..."}
                </button>
            {:else}
                <button 
                    class="btn btn-destructive"
                    on:click={stopSharing}
                >
                    Stop Sharing
                </button>
            {/if}
        </div>
    </div>
</div>
<style>
:global(body) {
    margin: 0;
    font-family: system-ui, sans-serif;
    background-color: #1a1a1a;
    color: #ffffff;
}
</style>