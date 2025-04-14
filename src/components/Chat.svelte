<script lang="ts">
  import { writable } from 'svelte/store';
  import AudioPlayer from './AudioPlayer.svelte';
  import type { WebSocketStore, WebSocketMessage } from '../stores/websocket';
  import { getContext } from 'svelte';

  /*
  export const websocket = writable<{
    lastMessage: ChatHistoryMessage | null;
  }>({
    lastMessage: null,
  });
  */
  const wsStore = getContext('websocket') as WebSocketStore;
  let messageInput = '';
  let messages: WebSocketMessage[] = [];
  let chatContainer: HTMLDivElement;

  function handleSubmit() {
    if (messageInput.trim()) {
      wsStore.sendMessage({ type: "text", data: { text: messageInput, audio: null, sender: 'user' }, timestamp: Date.now() });
      messageInput = '';
    }
  }

  // Subscribe to websocket store to handle incoming messages
  $: if (wsStore.lastMessage) {
    const message = {
      ...wsStore.lastMessage,
      timestamp: Date.now()
    };
    messages = [...messages, message];
    // Scroll to bottom after message added
    setTimeout(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 0);
  }
</script>

<div class="chat-container" bind:this={chatContainer}>
  <div class="messages">
    {#each messages as message (message.timestamp)}
      <div class="message {message.sender === 'ai' ? 'assistant' : 'user'}">
        <div class="avatar">
          {#if message.sender === 'ai'}
            <span>AI</span>
          {:else}
            <span>U</span>
          {/if}
        </div>
        <div class="content">
          {#if message.type === 'text'}
            <p>{message.data}</p>
          {:else if message.type === 'audio' && message.data}
            <AudioPlayer base64Audio={message.data} />
          {/if}
          <span class="timestamp">{new Date(message.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    {/each}
  </div>
  
  <form on:submit|preventDefault={handleSubmit}>
    <input
      type="text"
      bind:value={messageInput}
      placeholder="Type a message..."
    />
    <button type="submit">Send</button>
  </form>
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--container-bg, #2a2a2a);
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .message {
    display: flex;
    gap: 0.75rem;
    align-items: start;
  }

  .message.user {
    flex-direction: row-reverse;
  }

  .avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--avatar-bg, #3b82f6);
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .content {
    background-color: var(--message-bg, rgba(255, 255, 255, 0.05));
    padding: 0.75rem;
    border-radius: 0.5rem;
    max-width: 70%;
  }

  .user .content {
    background-color: var(--btn-primary-bg, #3b82f6);
    color: white;
  }

  .timestamp {
    display: block;
    font-size: 0.75rem;
    color: var(--text-secondary, rgba(229, 231, 235, 0.6));
    margin-top: 0.25rem;
  }

  form {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid var(--border-color, rgba(229, 231, 235, 0.1));
  }

  input {
    flex: 1;
    padding: 0.5rem;
    border-radius: 0.375rem;
    background-color: var(--message-bg, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--border-color, rgba(229, 231, 235, 0.1));
    color: var(--text-color, #ffffff);
  }

  button {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    background-color: var(--btn-primary-bg, #3b82f6);
    color: white;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  button:hover {
    background-color: var(--btn-primary-hover, #2563eb);
  }
</style>