<script lang="ts">
  
  import type { Response } from '../types/websocket';
  
  import { webSocketMessage } from '../stores/websocket';


  interface ChatMessage {
    timestamp: number;
    sender: string;
    text: string;
    id: number;
  }

  let messageInput = '';
  let messages: ChatMessage[] = [];
  let messageIdCounter = 0;
  let chatMessages: HTMLDivElement;
  let lastMessageTimestamp: number|undefined = new Date().getTime();

  // Watch for new messages
  // TODO: Check why this timestamp check is needed
  $: if ($webSocketMessage && $webSocketMessage.timestamp != lastMessageTimestamp) {
    console.log('Check if received message is Response message...');
    if ($webSocketMessage.type === "Response") {
      console.log('New Response received:', $webSocketMessage);
      let response: Response = $webSocketMessage as Response;
      const chatMessage: ChatMessage = {
        sender: response.context,
        text: response.data,
        timestamp: response.timestamp,
        id: messageIdCounter++
      };
      lastMessageTimestamp = $webSocketMessage.timestamp;
      messages = [...messages, chatMessage];
      console.log('we have now the following number of messages:' + messages.length);
      // Scroll to bottom after message added
      setTimeout(() => {
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }, 0);
    }
  }
</script>

<div class="messages"  bind:this={chatMessages}>
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
        <p class="content-text">{message.text}</p>
        <span class="timestamp">{new Date(message.timestamp).toLocaleString()}</span>
      </div>
    </div>
  {/each}
</div>

<style>
  .chat-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .chat-container {
    display: flex;
    flex-direction: column;
    height: 80%;
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
    padding: 1rem;
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

  .screen-share-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
  }
</style>