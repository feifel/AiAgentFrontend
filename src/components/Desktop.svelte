<script lang="ts">
  import { onMount } from 'svelte';
  import Chat from './Chat.svelte';
  import ScreenShare from './ScreenShare.svelte';
  import { chatEnabled } from '../stores/chat';
  import { screenEnabled } from '../stores/screen';
  import type { WebSocketService } from '../services/websocket';

  export let wsHandler: WebSocketService;

  // Window positions and sizes
  type WindowState = { x: number; y: number; w: number; h: number };
  let chatWindow: WindowState = { x: 60, y: 60, w: 400, h: 500 };
  let screenWindow: WindowState = { x: 500, y: 100, w: 600, h: 400 };

  type DragState = { type: 'chat' | 'screen'; offsetX: number; offsetY: number } | null;
  // --- CHANGE: Modified ResizeState to store window type and initial position ---
  // Removed 'win' reference, added 'type', 'startXPos', 'startYPos'
  type ResizeState = { type: 'chat' | 'screen'; startX: number; startY: number; startW: number; startH: number; startXPos: number; startYPos: number; } | null;
  let dragging: DragState = null;
  let resizing: ResizeState = null;
  let activeWindow: 'chat' | 'screen' = 'screen'; // Track the active window

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
        const maxX = viewportWidth - currentW;
        const maxY = viewportHeight - currentH;
        const clampedX = Math.max(0, Math.min(newX, maxX));
        const clampedY = Math.max(0, Math.min(newY, maxY));
        chatWindow = { ...chatWindow, x: clampedX, y: clampedY };
      } else if (dragging.type === 'screen') {
        const currentW = screenWindow.w;
        const currentH = screenWindow.h;
        const maxX = viewportWidth - currentW;
        const maxY = viewportHeight - currentH;
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

  // --- CHANGE: Modified startResize to store window type and initial position in ResizeState ---
  function startResize(e: MouseEvent, windowType: 'chat' | 'screen') {
    setActiveWindow(windowType);
    e.preventDefault();
    // Get the correct current window state based on type
    const targetWin = windowType === 'chat' ? chatWindow : screenWindow;
    // Store type, initial mouse coords, initial dimensions, and initial window position
    resizing = {
      type: windowType,
      startX: e.clientX,
      startY: e.clientY,
      startW: targetWin.w,
      startH: targetWin.h,
      startXPos: targetWin.x, // Store initial window X position
      startYPos: targetWin.y  // Store initial window Y position
    };
    window.addEventListener('mousemove', onResize);
    window.addEventListener('mouseup', stopResize);
  }

  // --- CHANGE: Modified onResize to use resizing.type and stored initial position ---
  function onResize(e: MouseEvent) {
    if (resizing) {
      // Calculate new dimensions based on mouse movement from start
      const newW = Math.max(250, resizing.startW + (e.clientX - resizing.startX));
      const newH = Math.max(150, resizing.startH + (e.clientY - resizing.startY));

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Use the stored initial position (resizing.startXPos/startYPos) for boundary checks
      const currentX = resizing.startXPos;
      const currentY = resizing.startYPos;

      // Prevent resizing beyond viewport boundaries based on initial position
      const clampedW = Math.min(newW, viewportWidth - currentX);
      const clampedH = Math.min(newH, viewportHeight - currentY);

      // Update the correct window state based on the stored type
      if (resizing.type === 'chat') {
          chatWindow = { ...chatWindow, w: clampedW, h: clampedH };
      } else if (resizing.type === 'screen') {
          screenWindow = { ...screenWindow, w: clampedW, h: clampedH };
      }
      // Removed redundant update to resizing.win.w/h as resizing.win no longer exists
    }
  }

  function stopResize() {
    resizing = null;
    window.removeEventListener('mousemove', onResize);
    window.removeEventListener('mouseup', stopResize);
  }

  // ... rest of script remains same ...
  function setActiveWindow(windowType: 'chat' | 'screen') {
    activeWindow = windowType;
  }

  function handleHeaderKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      console.log('Header activated via keyboard');
    }
  }

  $: if ($chatEnabled) {
    setActiveWindow('chat');
  }

  $: if ($screenEnabled) {
    setActiveWindow('screen');
  }
</script>

<!-- ... rest of template remains same, but update the startResize calls ... -->

{#if $chatEnabled}
  <div class="floating-window" role="dialog" aria-modal="false" aria-labelledby="chat-header" tabindex="-1" style="left: {chatWindow.x}px; top: {chatWindow.y}px; width: {chatWindow.w}px; height: {chatWindow.h}px; z-index: {activeWindow === 'chat' ? 21 : 20};" on:mousedown={() => setActiveWindow('chat')}>
    <div class="window-header" id="chat-header" role="toolbar" aria-label="Chat window header" tabindex="0" on:mousedown|stopPropagation={ (e) => startDrag(e, chatWindow, 'chat') } >
    Chat
    <button class="close-btn" on:click={() => chatEnabled.set(false)} aria-label="Close chat window">×</button>
    </div>
    <div class="window-content">
    <Chat/>
    </div>
    <!-- CHANGE: Pass only window type to startResize -->
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
    <!-- CHANGE: Pass only window type to startResize -->
    <button class="resize-handle" type="button" aria-label="Resize screenshare window" tabindex="-1" on:mousedown|stopPropagation={ (e) => startResize(e, 'screen') }></button>
  </div>
{/if}

<!-- ... styles remain the same ... -->
<style>
/* ... styles remain the same ... */
.floating-window {
  position: fixed;
  background: #23272f;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  border: 1px solid #444;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: none;
}
.window-header {
  background: #1a1d22;
  color: #fff;
  padding: 0.5rem 1rem;
  cursor: move;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
}
.window-content {
  flex: 1;
  overflow: auto;
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
  pointer-events: auto;
}
</style>