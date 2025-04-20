<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { WebSocketService } from './services/websocket';
  import Desktop from './components/Desktop.svelte';
  import Toolbar from './components/Toolbar.svelte';

  let wsHandler: WebSocketService;

  onMount(() => {
    wsHandler = new WebSocketService('ws://localhost:9073');
  });

  onDestroy(() => {
    wsHandler?.dispose();
  });
</script>

<div class="layout">
  <h1 class="title">AI Agent</h1>
  <main class="main-content">
    <Desktop {wsHandler} />
  </main>
  <Toolbar {wsHandler} />
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