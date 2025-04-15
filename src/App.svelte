<script lang="ts">
  import WebSocketProvider from './components/WebSocketProvider.svelte';
  import ScreenShare from './components/ScreenShare.svelte';
  import Toolbar from './components/Toolbar.svelte';
</script>

<WebSocketProvider url="ws://localhost:9073">
  <div class="layout">
    <header class="header">
      <h1 class="title">AI Agent</h1>
    </header>
    <main class="main-content">
      <ScreenShare />
    </main>
    <footer class="footer">
      <Toolbar />
    </footer>
  </div>
</WebSocketProvider>

<style>
  .layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    height: 100vh;
  }
  .header {
    flex: 0 0 auto;
    position: sticky;
    top: 0;
    width: 100%;
    z-index: 1001;
    box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    padding: 1rem 0;
    text-align: center;
  }
  .title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: bold;
  }
  .main-content {
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 1rem 0 0 0;
  }
  .footer {
    flex: 0 0 auto;
    position: sticky;
    bottom: 0;
    width: 100%;
    z-index: 1001;
    box-shadow: 0 -2px 4px rgba(0,0,0,0.03);
    display: flex;
    justify-content: center;
    padding: 0.5rem 0;
  }
</style>