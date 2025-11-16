<script lang="ts">
  import { chatMessages } from "../stores/chat";

  let chatMessagesElement: HTMLDivElement;
  // Reference to the anchor element at the bottom
  let bottomAnchorElement: HTMLDivElement;

  $effect(() => {
    // This effect depends on the $chatMessages store.
    // It will re-run whenever $chatMessages changes *after* the DOM has been updated.
    if ($chatMessages.length > 0 && bottomAnchorElement) {
      // Scroll the anchor element into view.
      // 'block: "end"' aligns the bottom of the anchor with the bottom of the scroll container.
      // 'behavior: "smooth"' uses the CSS scroll-behavior property.
      bottomAnchorElement.scrollIntoView({ behavior: "smooth", block: "end" });
    } 
  });
</script>

<div class="messages" bind:this={chatMessagesElement}>
  {#each $chatMessages as message (message.id)}
    <div class="message {message.sender}">
      <div class="avatar">
        {#if message.sender === "ai"}
          <span>AI</span>
        {:else}
          <span>ME</span>
        {/if}
      </div>
      <div class="content">
        <p class="content-text">{message.text}</p>
        <span class="timestamp"
          >{new Date(message.timestamp).toLocaleString()}</span
        >
      </div>
    </div>
  {/each}
  <!-- Add an empty div at the end to act as a scroll anchor -->
  <div bind:this={bottomAnchorElement}></div>
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
    /* Add smooth scrolling behavior for scrollTop changes */
    scroll-behavior: smooth;
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
    user-select: text;
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
    color: rgba(255, 255, 255, 0.7);
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