<script lang="ts">
  import { writable } from 'svelte/store';
  import AudioPlayer from './AudioPlayer.svelte';

  interface Message {
    type: string;
    text?: string;
    audio?: string;
    sender: 'user' | 'bot';
    timestamp: number;
  }

  export const websocket = writable<{
    lastMessage: WebSocketMessage | null;
  }>({
    lastMessage: null,
  });
  
  let messageInput = '';
  let messages: Message[] = [];

  function handleSubmit() {
    if (messageInput.trim()) {
      // Add user message
      messages = [...messages, {
        type: 'text',
        text: messageInput,
        sender: 'user',
        timestamp: Date.now()
      }];
      
      // Send via websocket
      websocket.update(ws => {
        if (ws) {
          // Send message logic here
        }
        return ws;
      });
      
      messageInput = '';
    }
  }

  // Subscribe to websocket store to handle incoming messages
  $: if ($websocket.lastMessage) {
    const message = $websocket.lastMessage;
    if (message.type === 'chat' && message.text) {
      messages = [...messages, {
        type: 'text',
        text: message.text,
        sender: 'bot',
        timestamp: Date.now()
      }];
    } else if (message.type === 'audio' && message.audio) {
      messages = [...messages, {
        type: 'audio',
        audio: message.audio,
        sender: 'bot',
        timestamp: Date.now()
      }];
    }
  }
</script>

<div class="chat-container">
  <div class="messages">
    {#each messages as message (message.timestamp)}
      <div class="message {message.sender}">
        <div class="avatar">
          {message.sender === 'bot' ? 'AI' : 'You'}
        </div>
        <div class="content">
          {#if message.type === 'text'}
            <p>{message.text}</p>
          {:else if message.type === 'audio'}
            <AudioPlayer base64Audio={message.audio} />
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
      placeholder="Type your message..."
    />
    <button type="submit">Send</button>
  </form>
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
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
    gap: 1rem;
    align-items: flex-start;
  }

  .message.user {
    flex-direction: row-reverse;
  }

  .avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: var(--avatar-bg);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .content {
    background: var(--message-bg);
    padding: 0.75rem;
    border-radius: 0.5rem;
    max-width: 70%;
  }

  .timestamp {
    display: block;
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }

  form {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--container-bg);
    border-top: 1px solid var(--border-color);
  }

  input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0.25rem;
    background: var(--message-bg);
    color: var(--text-color);
  }

  button {
    padding: 0.5rem 1rem;
    background: var(--btn-primary-bg);
    color: white;
    border: none;
    border-radius: 0.25rem;
    font-weight: 500;
    cursor: pointer;
  }

  button:hover {
    background: var(--btn-primary-hover);
  }
</style>