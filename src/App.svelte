<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { WebSocketService } from './services/websocket';
  import { wsService } from './stores/websocket';
  import Desktop from './components/Desktop.svelte';
  import Toolbar from './components/Toolbar.svelte';

  onMount(() => {
    // Set the WebSocketService instance in the store
    wsService.set(new WebSocketService('ws://localhost:9073'));
  });

  onDestroy(() => {
    $wsService?.dispose();
    // Clear the WebSocketService instance from the store
    wsService.set(null);
  });
</script>

<div class="layout">
  <h1 class="title">AI Agent</h1>
  <main class="main-content">
    <Desktop/>
  </main>
  <Toolbar/>
</div>

<style>
  .layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    height: 100vh;
  }
  .title {
    margin: auto;
    font-size: 1.5rem;
    font-weight: bold;
    z-index: 1001;
    padding-bottom: 10px;
  }
  .main-content {
    flex: 1 1 auto;
    overflow-y: auto;
  }
</style>