<script lang="ts">
  import AudioPlayer from './AudioPlayer.svelte';
  import type { WebSocketStore, WebSocketMessage, WebSocketState } from '../stores/websocket';
  import { getContext } from 'svelte';

  const wsStore = getContext('websocket') as WebSocketStore;
  let messageInput = '';
  let messages: (WebSocketMessage & { id: number })[] = [];
  let messageIdCounter = 0;
  let chatContainer: HTMLDivElement;
  let lastMessageTimestamp = 0;

  function handleSubmit() {
    if (messageInput.trim()) {
      const message = { 
        mime_type: "text/plain", 
        data: messageInput, 
        sender: 'user', 
        timestamp: Date.now(),
        id: messageIdCounter++
      };
      wsStore.sendMessage(message);
      messageInput = '';
    }
  }

  // Subscribe to store changes
  wsStore.subscribe((state: { ws: WebSocket | null; lastMessage: any }) => {
    if (state.lastMessage && state.lastMessage.mime_type === "text/plain") {
      console.log('New message detected:', state.lastMessage);
      lastMessageTimestamp = state.lastMessage.timestamp;
      const messageWithId = { ...state.lastMessage, id: messageIdCounter++ };
      messages = [...messages, messageWithId];
      console.log('we have now the following number of messages:' + messages.length);
      // Scroll to bottom after message added
      setTimeout(() => {
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 0);
    }
  });
</script>

<div class="chat-container" bind:this={chatContainer}>
  <div class="messages">
    {#each messages as message (message.id)}
      <div class="message {message.sender}">
        <div class="avatar">
          {#if message.sender === 'ai'}
            <span>AI</span>
          {:else}
            <span>ME</span>
          {/if}
        </div>
        <div class="content">
          {#if message.mime_type === 'text/plain'}
            <p class="content-text">{message.data}</p>
          {:else if message.mime_type === 'audio/pcm' && message.data}
            <AudioPlayer base64Audio={message.data} />
          {/if}
          <span class="timestamp">{new Date(message.timestamp).toLocaleString()}</span>
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
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 1rem;
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
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .ai .avatar {
    background-color: #353535;
  }

  .user .avatar {
    background-color: #3b82f6;
  }

  .content {
    background-color: var(--message-bg, rgba(255, 255, 255, 0.05));
    padding: 0.75rem;
    border-radius: 0.5rem;
    max-width: 70%;    
    text-align: left;
  }

  .content-text {
    margin-top: 0px;
    margin-bottom: 0px;
  }
  .user .content {
    background-color: var(--btn-primary-bg, #3b82f6);
    color: white;
  }

  .timestamp {
    display: block;
    font-size: 0.5rem;
    color: var(--text-secondary, rgba(229, 231, 235, 0.6));
    margin-top: 0.25rem;
  }

  .ai .timestamp {
    text-align: left;
  }

  .user .timestamp {
    text-align: right;
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