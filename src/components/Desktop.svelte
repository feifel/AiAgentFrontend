<!-- c:\Users\roman\source\repos\AiAgentFrontend\src\components\Desktop.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import Chat from './Chat.svelte';
  import ScreenShare from './ScreenShare.svelte';
  import { chatEnabled } from '../stores/chat';
  import { screenEnabled } from '../stores/screen';

  // Window positions and sizes
  type WindowState = { x: number; y: number; w: number; h: number };
  // Initialize with default values, will be updated onMount
  let chatWindow: WindowState = { x: 0, y: 0, w: 400, h: 500 };
  let screenWindow: WindowState = { x: 212, y: 76, w: 696, h: 493 };

  type DragState = { type: 'chat' | 'screen'; offsetX: number; offsetY: number } | null;
  type ResizeState = { type: 'chat' | 'screen'; startX: number; startY: number; startW: number; startH: number; startXPos: number; startYPos: number; } | null;
  let dragging: DragState = null;
  let resizing: ResizeState = null;
  let activeWindow: 'chat' | 'screen' = 'screen'; // Track the active window

  // Reference to the main container element of this component
  let desktopElement: HTMLDivElement;
  // Dynamically calculated bounds
  let desktopTopOffset = 0;
  let desktopAvailableHeight = window.innerHeight; // Initial fallback

  // Function to update desktop bounds based on the container element
  function updateDesktopBounds() {
    if (desktopElement) {
      desktopTopOffset = desktopElement.offsetTop;
      desktopAvailableHeight = desktopElement.offsetHeight;
    } else {
      // Fallback if element isn't ready (shouldn't happen in onMount)
      // Use the old hardcoded values as a safe default
      console.warn("Desktop element not found, using fallback spacing.");
      desktopTopOffset = 35;
      desktopAvailableHeight = window.innerHeight - 35 - 55;
    }
  }

  // Set initial bounds and add listeners
  onMount(() => {
    // Calculate the actual available space based on the component's rendered position
    updateDesktopBounds();

    // Initial layout is now handled by the reactive block below,
    // which will use the calculated desktopTopOffset and desktopAvailableHeight.
    // The old direct chatWindow initialization here is removed.

    const handleResize = () => {
      // Recalculate bounds on window resize
      updateDesktopBounds();

      // Check if the chat window is currently meant to be fullscreen/full-height
      // Adjust if necessary based on new bounds
      // We check if it occupies the full width and starts at the top offset
      if (chatWindow.x === 0 && chatWindow.w === window.innerWidth && chatWindow.y === desktopTopOffset) {
        chatWindow = {
          ...chatWindow, // keep x
          y: desktopTopOffset,
          w: window.innerWidth,
          h: desktopAvailableHeight // Use dynamic height
        };
      }
      // Similar check for screen window if it's meant to be fullscreen
      if (screenWindow.x === 0 && screenWindow.w === window.innerWidth && screenWindow.y === desktopTopOffset) {
         screenWindow = {
          ...screenWindow, // keep x
          y: desktopTopOffset,
          w: window.innerWidth,
          h: desktopAvailableHeight // Use dynamic height
        };
      }

      // Also update screen/chat window boundaries if needed during resize to prevent going out of bounds
      // (This part ensures windows stay within the overall viewport, which is generally correct)
      if (chatWindow.x + chatWindow.w > window.innerWidth) {
        chatWindow.x = Math.max(0, window.innerWidth - chatWindow.w);
      }
      if (chatWindow.y + chatWindow.h > window.innerHeight) {
        chatWindow.y = Math.max(0, window.innerHeight - chatWindow.h);
      }
      if (screenWindow.x + screenWindow.w > window.innerWidth) {
        screenWindow.x = Math.max(0, window.innerWidth - screenWindow.w);
      }
      if (screenWindow.y + screenWindow.h > window.innerHeight) {
        screenWindow.y = Math.max(0, window.innerHeight - screenWindow.h);
      }
    };

    // Add event listeners for toolbar icon clicks (no changes needed here)
    const handleToggleChat = () => {
      if (activeWindow !== 'chat') {
        setActiveWindow('chat');
      } else {
        chatEnabled.set(false);
      }
    };

    const handleToggleScreenShare = () => {
      if (activeWindow !== 'screen') {
        setActiveWindow('screen');
      } else {
        screenEnabled.set(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('toggleChat', handleToggleChat);
    window.addEventListener('toggleScreenShare', handleToggleScreenShare);

    // Cleanup listener when component is destroyed
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('toggleChat', handleToggleChat);
      window.removeEventListener('toggleScreenShare', handleToggleScreenShare);
    };
  });

  // Reactive statement to handle window layout when enabled states change
  $: {
    // Ensure bounds are calculated before layout updates
    // This might run before onMount completes if stores change early,
    // so checking desktopElement helps, though updateDesktopBounds has a fallback.
    if (desktopElement) {
        updateDesktopBounds(); // Recalculate bounds if stores change, potentially causing layout shifts
    }

    const currentAvailableHeight = desktopAvailableHeight; // Use calculated height
    const currentTopOffset = desktopTopOffset; // Use calculated top offset

    if ($chatEnabled && $screenEnabled) {
      // Both windows are enabled, arrange side-by-side within available space
      const halfWidth = window.innerWidth / 2;
      chatWindow = { x: 0, y: currentTopOffset, w: halfWidth, h: currentAvailableHeight };
      screenWindow = { x: halfWidth, y: currentTopOffset, w: halfWidth, h: currentAvailableHeight };
    } else if ($chatEnabled) {
      // Only chat is enabled, make it full width within available space
      chatWindow = { x: 0, y: currentTopOffset, w: window.innerWidth, h: currentAvailableHeight };
    } else if ($screenEnabled) {
      // Only screen share is enabled, make it full width within available space
      screenWindow = { x: 0, y: currentTopOffset, w: window.innerWidth, h: currentAvailableHeight };
    }
    // If neither is enabled, their state remains as it was, but they won't be visible
  }


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
      const viewportHeight = window.innerHeight; // Use full viewport height for drag constraints

      if (dragging.type === 'chat') {
        const currentW = chatWindow.w;
        const currentH = chatWindow.h;
        // Ensure window doesn't go outside viewport during drag
        const maxX = Math.max(0, viewportWidth - currentW);
        const maxY = Math.max(0, viewportHeight - currentH);
        const clampedX = Math.max(0, Math.min(newX, maxX));
        // Clamp Y relative to the overall viewport, not just the desktop area
        const clampedY = Math.max(0, Math.min(newY, maxY));
        chatWindow = { ...chatWindow, x: clampedX, y: clampedY };
      } else if (dragging.type === 'screen') {
        const currentW = screenWindow.w;
        const currentH = screenWindow.h;
        // Ensure window doesn't go outside viewport during drag
        const maxX = Math.max(0, viewportWidth - currentW);
        const maxY = Math.max(0, viewportHeight - currentH);
        const clampedX = Math.max(0, Math.min(newX, maxX));
        // Clamp Y relative to the overall viewport
        const clampedY = Math.max(0, Math.min(newY, maxY));
        screenWindow = { ...screenWindow, x: clampedX, y: clampedY };
      }
    }
  }

  function stopDrag() {
    // ... rest of code remains same
    dragging = null;
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', stopDrag);
  }

  function startResize(e: MouseEvent, windowType: 'chat' | 'screen') {
    // ... rest of code remains same
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
      const viewportHeight = window.innerHeight; // Use full viewport height for resize constraints
      const currentX = resizing.startXPos;
      const currentY = resizing.startYPos;

      // Prevent resizing beyond viewport boundaries
      newW = Math.min(newW, viewportWidth - currentX);
      // Use viewportHeight for boundary check, not just desktopAvailableHeight
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
    // ... rest of code remains same
    resizing = null;
    window.removeEventListener('mousemove', onResize);
    window.removeEventListener('mouseup', stopResize);
  }

  function setActiveWindow(windowType: 'chat' | 'screen') {
    // ... rest of code remains same
    activeWindow = windowType;
  }

  function handleHeaderKeyDown(e: KeyboardEvent) {
    // ... rest of code remains same
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
    setActiveWindow('screen');
  }

</script>

<!-- Wrap the windows in a container div to measure its bounds -->
<div class="desktop-container" bind:this={desktopElement}>
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
      <ScreenShare/>
      </div>
      <button class="resize-handle" type="button" aria-label="Resize screenshare window" tabindex="-1" on:mousedown|stopPropagation={ (e) => startResize(e, 'screen') }></button>
    </div>
  {/if}
</div>


<!-- Styles remain the same -->
<style>
/* Add style for the new container */
.desktop-container {
  position: relative; /* Needed for offsetTop calculation relative to parent */
  width: 100%;
  height: 100%; /* Ensure it fills the parent space */
  /* border: 1px dashed red; */ /* Optional: for debugging layout */
}

/* ... rest of styles remain the same ... */
.floating-window {
  position: fixed; /* Keep windows fixed relative to viewport */
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