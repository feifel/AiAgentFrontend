<script lang="ts">
  import avatarIcon from '../assets/avatar.png';
  import chatIcon from '../assets/chat.svg';
  import type { WebSocketService } from '../services/websocket';
  import type { Request } from '../types/websocket';
  import { screenEnabled } from '../stores/screen';
  import { receivedAudioData, audioLevel, microphoneEnabled } from '../stores/audio';
  import { audioPlayer } from '../services/audioplayer';
  import { chatEnabled, addMessage } from '../stores/chat';  
  import { configuration, wsService } from '../stores/websocket';  
  import AudioCapture from './AudioCapture.svelte';

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'German' }
  ];

  const llms = [
    { id: 'gemma-3', name: 'Gemma 3' },
    { id: 'quen-2.5', name: 'Quen 2.5' }
  ];

  let selectedLLM = 'gemma-3';
  let selectedLanguage = 'en';
  let terminalEnabled = true;
  let paperclipEnabled = false;
  let avatarEnabled = false; // Toggle for woman portrait
  let terminalText = ''; // Add new variable for terminal text

  function handleSendMessage() {
    if (terminalText.trim()) {
      const request: Request = {
        type: 'Request',
        timestamp: Date.now(),
        data: terminalText,
        context: "user"
      };
      $wsService?.sendMessage(request);
      addMessage(request);
      terminalText = ''; // Clear the input after sending
    }
  }

  $: if ($receivedAudioData) {
    audioPlayer.processBase64Audio($receivedAudioData);
  }
</script>

<div class="toolbar-container">
  <div class="toolbar">
    <select bind:value={selectedLLM} class="llm-select">
      {#each llms as llm}
        <option value={llm.id}>{llm.name}</option>
      {/each}
    </select>

    <select bind:value={selectedLanguage} class="language-select">
      {#each languages as lang}
        <option value={lang.code}>{lang.name}</option>
      {/each}
    </select>

    <button 
      class="toggle-button" 
      class:active={terminalEnabled}
      onclick={() => terminalEnabled = !terminalEnabled}
    >
      ⌨️
    </button>

    <button 
      class="toggle-button" 
      class:active={paperclipEnabled}
      onclick={() => paperclipEnabled = !paperclipEnabled}
      aria-label="Attach file"
    >
      📎
    </button>

    <button 
      class="toggle-button" 
      class:active={$microphoneEnabled} 
      onclick={() => microphoneEnabled.set(!$microphoneEnabled)}
    >
      🎤
    </button>
    <button 
      class="toggle-button"
      class:active={$configuration?.audioOutput}
      onclick={() => configuration.update(config => ({ 
        ...$configuration, 
        audioOutput: !$configuration.audioOutput 
      }))}
    >
      🔊
    </button>
    <button 
      class="toggle-button" 
      class:active={$chatEnabled}
      onclick={() => {
        if ($chatEnabled) {
          // Import the function from Desktop component
          window.dispatchEvent(new CustomEvent('toggleChat'));
        } else {
          chatEnabled.set(true);
        }
      }}
      aria-label="Toggle Chat"
    >
      <img src={chatIcon} alt="Chat" class="select-icon" />
    </button>
    <button 
      class="toggle-button" 
      class:active={$screenEnabled}
      onclick={() => {
        if ($screenEnabled) {
          window.dispatchEvent(new CustomEvent('toggleScreenShare'));
        } else {
          screenEnabled.set(true);
        }
      }}
      aria-label="Toggle computer screen"
    >
      🖥️
    </button>

    <button 
      class="toggle-button" 
      class:active={avatarEnabled}
      onclick={() => avatarEnabled = !avatarEnabled}
      aria-label="Toggle Avatar"
    >
      <img src={avatarIcon} alt="Avatar" class="select-icon" />
    </button>
  </div>
  
  <AudioCapture />

  {#if terminalEnabled}
    <div class="terminal-container">
      <textarea
        bind:value={terminalText}
        class="terminal-textarea"
        placeholder="Enter your text here..."
        rows="4"
        onkeydown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
      ></textarea>
      <button class="send-button" onclick={handleSendMessage} aria-label="Send message">
        ➤
      </button>
    </div>
  {/if}
</div>

<style>
  .toolbar-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: auto;
    z-index: 1001;    
    padding-top: 10px;
  }

  .toolbar {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #f3f3f3;
    border-radius: 0.5rem;
    align-items: center;
  }

  select {
    padding: 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid var(--select-border, #ccc);
    background: var(--select-bg, white);
    color: var(--select-text, black);
  }

  select option {
    background: var(--select-bg, white);
    color: var(--select-text, inherit);
  }

  .language-select {
    width: auto;
  }

  .llm-select {
    flex: 1;
    min-width: 8rem;
  }

  .toggle-button {
    padding: 0.5rem;
    border: 1px solid var(--button-border, #ccc);
    border-radius: 0.25rem;
    background: var(--button-bg, white);
    cursor: pointer;
    transition: background-color 0.2s;
    height: 2.10rem;
    width: 2.10rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .toggle-button.active {
    background: var(--button-active-bg, #3aa0ff);
    border-color: var(--button-active-border, #334bff);
  }

  .toggle-button:not(.active):hover {
    background: var(--button-hover-bg, #f0f0f0);
  }

  .select-icon {
    width: 1.2em;
    height: 1.2em;
    vertical-align: middle;
  }

  .terminal-container {
    position: relative;
    width: 100%;
  }

  .terminal-textarea {
    width: 100%;
    padding: 0.5rem;
    padding-right: 3rem;
    border: 1px solid var(--select-border, #ccc);
    border-radius: 0.5rem;
    background: var(--select-bg, white);
    color: var(--select-text, black);
    resize: vertical;
    min-height: 100px;
    font-family: monospace;
    box-sizing: border-box;
  }

  .send-button {
    position: absolute;
    right: 0.5rem;
    bottom: 0.75rem;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: var(--btn-primary-bg, #3b82f6);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: background-color 0.2s;
    padding: 0;
  }

  .send-button:hover {
    background: var(--btn-primary-hover, #2563eb);
  }

  :global([data-theme="dark"]) {
    --toolbar-bg: #2d2d2d;
    --select-bg: #383838;
    --select-border: #555;
    --select-text: #ffffff;
    --button-bg: #383838;
    --button-border: #555;
    --button-active-bg: #3b9dff;
    --button-active-border: #2d6dad;
    --button-hover-bg: #454545;
    .terminal-textarea {
      background: var(--select-bg);
      color: var (--select-text);
      border-color: var(--select-border);
    }
    .send-button {
      background: var(--btn-primary-bg, #3b82f6);
    }
    .send-button:hover {
      background: var(--btn-primary-hover, #2563eb);
    }
  }

</style>