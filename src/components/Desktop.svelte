<script lang="ts">
  import { onMount } from 'svelte'; // Ensure onMount is imported
  import Chat from './Chat.svelte';
  import ScreenShare from './ScreenShare.svelte';
  import { chatEnabled } from '../stores/chat';
  import { screenEnabled } from '../stores/screen';
  import type { WebSocketService } from '../services/websocket';

  export let wsHandler: WebSocketService;

  // Window positions and sizes
  type WindowState = { x: number; y: number; w: number; h: number };
  // Initialize with default values, will be updated onMount for chatWindow
  let chatWindow: WindowState = { x: 0, y: 0, w: 400, h: 500 };
  let screenWindow: WindowState = { x: 212, y: 76, w: 696, h: 493 };

  type DragState = { type: 'chat' | 'screen'; offsetX: number; offsetY: number } | null;
  type ResizeState = { type: 'chat' | 'screen'; startX: number; startY: number; startW: number; startH: number; startXPos: number; startYPos: number; } | null;
  let dragging: DragState = null;
  let resizing: ResizeState = null;
  let activeWindow: 'chat' | 'screen' = 'screen'; // Track the active window

  // Set chat window to full width with spacing at top and bottom
  onMount(() => {
    // Set chat window to full width with specified spacing
    chatWindow = {
      x: 0,
      y: 35, // 35px space from the top
      w: window.innerWidth,
      h: window.innerHeight - 35 - 55 // Subtract top (35px) and bottom (50px) spacing
    };

    // Add resize listener to maintain full width and specified spacing when browser is resized
    const handleResize = () => {
        // Check if the chat window is currently meant to be fullscreen
        // For simplicity, we'll just update it if it's roughly fullscreen.
        // A more robust solution might involve a dedicated state flag.
        if (chatWindow.x === 0 && chatWindow.y === 35) {
             chatWindow = {
                ...chatWindow, // keep x, y
                w: window.innerWidth,
                h: window.innerHeight - 35 - 55 // Maintain top and bottom spacing
             };
        }
        // Also update screen window boundaries if needed during resize
        // (This part is related to existing drag/resize logic, ensuring
        // windows don't go out of bounds after a browser resize)
        if (screenWindow.x + screenWindow.w > window.innerWidth) {
            screenWindow.x = Math.max(0, window.innerWidth - screenWindow.w);
        }
         if (screenWindow.y + screenWindow.h > window.innerHeight) {
            screenWindow.y = Math.max(0, window.innerHeight - screenWindow.h);
        }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup listener when component is destroyed
    return () => {
        window.removeEventListener('resize', handleResize);
    };
  });




  function startDrag(e: MouseEvent, win: WindowState, windowType: 'chat' | 'screen') {
    setActiveWindow(windowType);
    e.preventDefault();
    dragging = { type: windowType, offsetX: e.clientX - win.x, offsetY: e.clientY - win.y };
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
  }

  function onDrag(e: MouseEvent) {
    if (dragging) {
    let newX = e.clientX - dragging.offsetX;
    let newY = e.clientY - dragging.offsetY;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (dragging.type === 'chat') {
    const currentW = chatWindow.w;
    const currentH = chatWindow.h;
    // Ensure window doesn't go outside viewport during drag
    const maxX = Math.max(0, viewportWidth - currentW); // Prevent negative max if window is wider than viewport
    const maxY = Math.max(0, viewportHeight - currentH); // Prevent negative max if window is taller than viewport
    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));
    chatWindow = { ...chatWindow, x: clampedX, y: clampedY };
    } else if (dragging.type === 'screen') {
    const currentW = screenWindow.w;
    const currentH = screenWindow.h;
    // Ensure window doesn't go outside viewport during drag
    const maxX = Math.max(0, viewportWidth - currentW);
    const maxY = Math.max(0, viewportHeight - currentH);
    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));
    screenWindow = { ...screenWindow, x: clampedX, y: clampedY };
    }
    }
  }

  function stopDrag() {
    dragging = null;
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', stopDrag);
  }

  function startResize(e: MouseEvent, windowType: 'chat' | 'screen') {
    setActiveWindow(windowType);
    e.preventDefault();
    const targetWin = windowType === 'chat' ? chatWindow : screenWindow;
    resizing = {
    type: windowType,
    startX: e.clientX,
    startY: e.clientY,
    startW: targetWin.w,
    startH: targetWin.h,
    startXPos: targetWin.x,
    startYPos: targetWin.y
    };
    window.addEventListener('mousemove', onResize);
    window.addEventListener('mouseup', stopResize);
  }

  function onResize(e: MouseEvent) {
    if (resizing) {
    // Minimum dimensions
    const minW = 250;
    const minH = 150;

    // Calculate potential new dimensions
    const potentialW = resizing.startW + (e.clientX - resizing.startX);
    const potentialH = resizing.startH + (e.clientY - resizing.startY);

    // Enforce minimum dimensions
    let newW = Math.max(minW, potentialW);
    let newH = Math.max(minH, potentialH);

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const currentX = resizing.startXPos;
    const currentY = resizing.startYPos;

    // Prevent resizing beyond viewport boundaries
    // Ensure new width doesn't exceed available space from the window's starting X position
    newW = Math.min(newW, viewportWidth - currentX);
    // Ensure new height doesn't exceed available space from the window's starting Y position
    newH = Math.min(newH, viewportHeight - currentY);

    // Re-check minimum dimensions after clamping to viewport
    newW = Math.max(minW, newW);
    newH = Math.max(minH, newH);


    if (resizing.type === 'chat') {
    chatWindow = { ...chatWindow, w: newW, h: newH };
    } else if (resizing.type === 'screen') {
    screenWindow = { ...screenWindow, w: newW, h: newH };
    }
    }
  }

  function stopResize() {
    resizing = null;
    window.removeEventListener('mousemove', onResize);
    window.removeEventListener('mouseup', stopResize);
  }

  function setActiveWindow(windowType: 'chat' | 'screen') {
    activeWindow = windowType;
  }

  function handleHeaderKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    console.log('Header activated via keyboard');
    // Potentially bring window to front or handle other actions
    }
  }

  // Set active window based on which store enables last (or first)
  // Consider if initial active state needs specific logic if both start enabled
  $: if ($chatEnabled) {
    setActiveWindow('chat');
  }

  $: if ($screenEnabled) {
    // Set specific dimensions when screenshare is opened
    //screenWindow = { x: 212, y: 76, w: 696, h: 493 };
    setActiveWindow('screen');
  }

</script>

<!-- HTML Template remains the same -->
{#if $chatEnabled}
  <div class="floating-window" role="dialog" aria-modal="false" aria-labelledby="chat-header" tabindex="-1" style="left: {chatWindow.x}px; top: {chatWindow.y}px; width: {chatWindow.w}px; height: {chatWindow.h}px; z-index: {activeWindow === 'chat' ? 21 : 20};" on:mousedown={() => setActiveWindow('chat')}>
    <div class="window-header" id="chat-header" role="toolbar" aria-label="Chat window header" tabindex="0" on:mousedown|stopPropagation={ (e) => startDrag(e, chatWindow, 'chat') } >
    Chat
    <button class="close-btn" on:click={() => chatEnabled.set(false)} aria-label="Close chat window">×</button>
    </div>
    <div class="window-content">
    <Chat/>
    </div>
    <button class="resize-handle" type="button" aria-label="Resize chat window" tabindex="-1" on:mousedown|stopPropagation={ (e) => startResize(e, 'chat') }></button>
  </div>
{/if}

{#if $screenEnabled}
  <div class="floating-window" role="dialog" aria-modal="false" aria-labelledby="screenshare-header" tabindex="-1" style="left: {screenWindow.x}px; top: {screenWindow.y}px; width: {screenWindow.w}px; height: {screenWindow.h}px; z-index: {activeWindow === 'screen' ? 21 : 20};" on:mousedown={() => setActiveWindow('screen')}>
    <div class="window-header" id="screenshare-header" role="toolbar" aria-label="ScreenShare window header" tabindex="0" on:mousedown|stopPropagation={ (e) => startDrag(e, screenWindow, 'screen') } >
    ScreenShare
    <button class="close-btn" on:click={() => screenEnabled.set(false)} aria-label="Close screenshare window">×</button>
    </div>
    <div class="window-content">
    <ScreenShare {wsHandler} />
    </div>
    <button class="resize-handle" type="button" aria-label="Resize screenshare window" tabindex="-1" on:mousedown|stopPropagation={ (e) => startResize(e, 'screen') }></button>
  </div>
{/if}


<!-- Styles remain the same -->
<style>
/* ... styles remain the same ... */
.floating-window {
  position: fixed;
  background: #23272f;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  border: 1px solid #444;
  overflow: hidden; /* Important for content clipping */
  display: flex;
  flex-direction: column;
  user-select: none;
  /* Add min dimensions if not handled by resize logic */
  min-width: 250px;
  min-height: 150px;
}
.window-header {
  background: #1a1d22;
  color: #fff;
  padding: 0.5rem 0.8rem;
  cursor: move;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  flex-shrink: 0; /* Prevent header from shrinking */
}
.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0rem;
}
.window-content {
  flex-grow: 1; /* Allow content to fill available space */
  overflow: auto; /* Add scrollbars if content overflows */
  background: #23272f;
}
.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 18px;
  height: 18px;
  cursor: se-resize;
  background: linear-gradient(135deg, transparent 60%, #888 60%);
  border: none;
  padding: 0;
  pointer-events: auto; /* Ensure it's clickable */
  z-index: 1; /* Ensure it's above content */
  flex-shrink: 0; /* Prevent handle from shrinking */
}
</style>