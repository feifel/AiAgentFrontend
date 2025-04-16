<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { getContext } from 'svelte';
    import { Base64 } from 'js-base64';
    import type { WebSocketStore } from '../stores/websocket';
    import { receivedAudioData, audioLevel } from '../stores/audio';
    import Chat from './Chat.svelte';

    interface ChatMessage {
        text: string;
        timestamp: string;
    }

    interface AudioStats {
        rms: number;
        maxAmplitude: number;
        bufferSize: number;
    }

    const wsStore = getContext('websocket') as WebSocketStore;
    let isSharing = false;
    let playbackAudioLevel = 0;
    let videoRef: HTMLVideoElement;
    let audioContext: AudioContext | null = null;
    let audioStream: MediaStream | null = null;
    let audioWorkletNode: AudioWorkletNode | null = null;
    let captureInterval: ReturnType<typeof setInterval>;
    let isConnected = false;
    let lastMessageTime = 0;
    let audioStats: AudioStats | null = null;
    
    let messages: ChatMessage[] = [{
        text: "Screen sharing session started. I'll transcribe what I see.",
        timestamp: new Date().toLocaleTimeString()
    }];

    wsStore.subscribe((state: { ws: WebSocket | null; lastMessage: any }) => {
        isConnected = state.ws !== null;
        
        // Handle incoming WebSocket messages
        if (state.lastMessage && Date.now() - lastMessageTime > 100) { // Debounce messages
            lastMessageTime = Date.now();            
            if (state.lastMessage.mime_type === 'audio/pcm' && state.lastMessage.sender === 'ai') {
                console.log('Received audio data...');
                receivedAudioData.set(state.lastMessage.data);
            }
        }
    });

    async function startSharing() {
        if (isSharing) return;

        try {
            console.log('Starting screen and audio sharing...');
            
            // Get screen stream
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false
            });
            console.log('Screen stream obtained successfully');
            
            // Get audio stream
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

            // Set up audio context and processing
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

            // Set up audio processing
            audioWorkletNode.port.onmessage = (event) => {
                const { pcmData, level, stats } = event.data;
                audioLevel.set(level);
                audioStats = stats;
                
                if (pcmData) {
                    const base64Data = Base64.fromUint8Array(new Uint8Array(pcmData));
                    wsStore.sendMessage({
                        timestamp: Date.now(),
                        sender: 'user',
                        mime_type: 'audio/pcm',
                        data: base64Data,
                        audioLevel: level
                    });
                }
            };

            source.connect(audioWorkletNode);
            console.log('Audio processing pipeline connected');

            // Set up video stream
            if (videoRef) {
                videoRef.srcObject = screenStream;
                console.log('Video stream connected to video element');
                
                // Start screen capture interval
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
                            wsStore.sendMessage({
                                timestamp: Date.now(),
                                sender: 'user',
                                mime_type: 'image/jpeg',
                                data: imageData
                            });
                        }
                    }
                }, 3000);
            }

            // Send initial setup message
            console.log('Sending initial setup message');
            wsStore.sendMessage({
                setup: {}
            });

            isSharing = true;
            console.log('Screen and audio sharing started successfully');
        } catch (err) {
            console.error('Failed to start sharing:', err);
            stopSharing();
        }
    }

    function stopSharing() {
        // Stop video stream
        if (videoRef?.srcObject) {
            const stream = videoRef.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.srcObject = null;
        }

        // Stop audio stream
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }

        // Stop screen capture interval
        if (captureInterval) {
            clearInterval(captureInterval);
        }

        // Clean up audio processing
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
    <!-- Screen Preview -->
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
                    class="btn {isConnected ? 'btn-primary' : 'btn-disabled'}"
                    on:click={startSharing}
                    disabled={!isConnected}
                >
                    {isConnected ? "Start Screen Share" : "Connecting to server..."}
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