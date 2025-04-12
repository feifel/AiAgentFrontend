<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { getContext } from 'svelte';
    import { Base64 } from 'js-base64';
    import type { WebSocketStore } from '../stores/websocket';
    import AudioPlayer from './AudioPlayer.svelte';

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
    let audioLevel = 0;
    let playbackAudioLevel = 0;
    let videoRef: HTMLVideoElement;
    let audioContext: AudioContext | null = null;
    let audioStream: MediaStream | null = null;
    let audioWorkletNode: AudioWorkletNode | null = null;
    let captureInterval: ReturnType<typeof setInterval>;
    let isConnected = false;
    let receivedAudioData: string | null = null;
    let lastMessageTime = 0;
    let audioStats: AudioStats | null = null;
    let showDiagnostics = false;
    
    let messages: ChatMessage[] = [{
        text: "Screen sharing session started. I'll transcribe what I see.",
        timestamp: new Date().toLocaleTimeString()
    }];

    wsStore.subscribe((state: { ws: WebSocket | null; lastMessage: any }) => {
        isConnected = state.ws !== null;
        
        // Handle incoming WebSocket messages
        if (state.lastMessage && Date.now() - lastMessageTime > 100) { // Debounce messages
            lastMessageTime = Date.now();
            console.log('Received WebSocket message:', state.lastMessage);
            
            if (state.lastMessage.audio) {
                console.log('Received audio data from message');
                receivedAudioData = state.lastMessage.audio;
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
                    sampleRate: 16000
                }
            });
            console.log('Audio stream obtained successfully with settings:', {
                channelCount: audioStream.getAudioTracks()[0].getSettings().channelCount,
                sampleRate: audioStream.getAudioTracks()[0].getSettings().sampleRate
            });

            // Set up audio context and processing
            audioContext = new AudioContext({
                sampleRate: 16000,
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
                    sampleRate: 16000,
                    bufferSize: 4096,
                },
                channelCount: 1,
                channelCountMode: 'explicit',
                channelInterpretation: 'speakers'
            });

            // Set up audio processing
            audioWorkletNode.port.onmessage = (event) => {
                const { pcmData, level, stats } = event.data;
                audioLevel = level;
                audioStats = stats;
                
                if (pcmData) {
                    console.log('Audio stats:', stats);
                    const base64Data = Base64.fromUint8Array(new Uint8Array(pcmData));
                    console.log('Sending audio data over WebSocket, base64 length:', base64Data.length);
                    wsStore.sendMediaChunk({
                        mime_type: "audio/pcm",
                        data: base64Data
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
                            console.log('Sending screen capture over WebSocket, base64 length:', imageData.length);
                            wsStore.sendMediaChunk({
                                mime_type: "image/jpeg",
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
        audioLevel = 0;
    }

    onDestroy(() => {
        stopSharing();
    });
</script>

<div class="screen-share-container">
    <!-- Welcome Header -->
    <div class="screen-share-header">
        <h1 class="screen-share-title">
            Welcome to AI Screen Sharing Assistant
        </h1>
        <p class="screen-share-subtitle">
            Share your screen and talk to me
        </p>
    </div>

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
            <!-- Combined Audio Level Indicator -->
            {#if isSharing}
                <div class="audio-level">
                    <div 
                        class="audio-level-indicator" 
                        style="width: {Math.max(audioLevel, playbackAudioLevel)}%"
                    ></div>
                </div>
            {/if}
            
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

    <!-- Audio Playback -->
    {#if receivedAudioData}
        <div class="audio-playback">
            <h3>Received Audio</h3>
            <AudioPlayer base64Audio={receivedAudioData} />
        </div>
    {/if}

    <!-- Audio Diagnostics -->
    <div class="diagnostics-container">
        <button class="btn btn-primary" on:click={() => showDiagnostics = !showDiagnostics}>
            {showDiagnostics ? 'Hide' : 'Show'} Audio Diagnostics
        </button>
        
        {#if showDiagnostics && audioStats}
            <div class="diagnostics-panel">
                <h3>Audio Diagnostics</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <label for="rms-level">RMS Level:</label>
                        <span id="rms-level">{(audioStats.rms * 100).toFixed(2)}%</span>
                    </div>
                    <div class="stat-item">
                        <label for="max-amplitude">Max Amplitude:</label>
                        <span id="max-amplitude">{(audioStats.maxAmplitude * 100).toFixed(2)}%</span>
                    </div>
                    <div class="stat-item">
                        <label for="buffer-size">Buffer Size:</label>
                        <span id="buffer-size">{audioStats.bufferSize} samples</span>
                    </div>
                    <div class="stat-item">
                        <label for="audio-level">Audio Level:</label>
                        <span id="audio-level">{audioLevel.toFixed(2)}%</span>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Chat History -->
    <div class="chat-container">
        <div class="chat-header">
            <h2>Chat History</h2>
        </div>
        <div class="chat-history">
            <div>
                {#each messages as message}
                    <div class="chat-message">
                        <div class="avatar">
                            <span>AI</span>
                        </div>
                        <div class="message-content">
                            <p class="message-text">{message.text}</p>
                            <p class="message-timestamp">{message.timestamp}</p>
                        </div>
                    </div>
                {/each}
            </div>
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

.audio-playback {
    max-width: 640px;
    margin: 2rem auto 0;
    padding: 1.5rem;
    background-color: var(--container-bg, #2a2a2a);
    border-radius: 0.5rem;
}

.audio-playback h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: var(--text-color, #ffffff);
}

.diagnostics-container {
    max-width: 640px;
    margin: 2rem auto 0;
    padding: 1.5rem;
    background-color: var(--container-bg, #2a2a2a);
    border-radius: 0.5rem;
}

.diagnostics-panel {
    margin-top: 1rem;
    padding: 1rem;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 0.375rem;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 0.5rem;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 0.25rem;
}

.stat-item label {
    color: var(--text-secondary);
}

.stat-item span {
    font-family: monospace;
    color: var(--text-color);
}
</style>