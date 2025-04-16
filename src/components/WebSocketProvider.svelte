<script lang="ts">
  import { onMount, setContext } from "svelte";
  import { createWebSocketStore } from '../stores/websocket';

  export let url: string;

  const wsStore = createWebSocketStore(url);
  setContext('websocket', wsStore);
</script>

<slot></slot>