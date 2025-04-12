<script lang="ts">
  import { setContext } from 'svelte';
  import { createWebSocketStore } from './stores/websocket';
  import ScreenShare from './components/ScreenShare.svelte';

  const wsStore = createWebSocketStore('ws://localhost:9073');
  setContext('websocket', wsStore);
</script>

<main class="container full-height">
  <ScreenShare />
</main>
