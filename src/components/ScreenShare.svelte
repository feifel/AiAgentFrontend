<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import type { WebSocketService } from '../services/websocket';

    export let wsHandler: WebSocketService;

    let isSharing = false;
    let videoRef: HTMLVideoElement;
    let captureInterval: ReturnType<typeof setInterval>;
   
    // Start sharing automatically when component is mounted
    onMount(() => {
        if (wsHandler.isConnected) {
            startSharing();
        } else {
            // If not connected yet, wait for connection
            const checkConnection = setInterval(() => {
                if (wsHandler.isConnected) {
                    clearInterval(checkConnection);
                    startSharing();
                }
            }, 500);
            
            // Clean up interval if component is destroyed before connection
            return () => clearInterval(checkConnection);
        }
    });

    async function startSharing() {
        if (isSharing) return;

        try {
            console.log('Starting screen sharing...');
            
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false
            });
            console.log('Screen stream obtained successfully');

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
            console.log('Screen sharing started successfully');
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

        if (captureInterval) {
            clearInterval(captureInterval);
        }

        isSharing = false;
    }

    onDestroy(() => {
        stopSharing();
    });
</script>

<div class="screen-share-container">
    <video
        bind:this={videoRef}
        autoplay
        playsinline
        muted
        class="video-preview"
    ></video>
    
    <div class="status-indicator">
        {#if !isSharing}
            <span class="sharing-inactive">{wsHandler.isConnected ? "Initializing screen share..." : "Connecting to server..."}</span>
        {/if}
    </div>
</div>

<style>
    :global(body) {
        margin: 0;
        font-family: system-ui, sans-serif;
        background-color: #1a1a1a;
        color: #ffffff;
    }

    .screen-share-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        position: relative;
    }

    .video-preview {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background-color: #000;
    }

    .status-indicator {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 16px;
        border-radius: 4px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        font-size: 14px;
    }

    .sharing-inactive {
        color: #f44336;
    }
</style>