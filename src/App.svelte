<script lang="ts">
  import WebSocketProvider from './components/WebSocketProvider.svelte';
  import ScreenShare from './components/ScreenShare.svelte';
</script>

<WebSocketProvider url="ws://localhost:9073">
  <main class="container full-height">
    <ScreenShare />
  </main>
</WebSocketProvider>