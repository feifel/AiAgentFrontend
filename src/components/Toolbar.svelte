<!-- c:\Users\roman\source\repos\AiAgentFrontend\src\components\Toolbar.svelte -->
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
  import { languages, llms, systemPrompts } from '../config/app-config';

  let selectedLLM: string;
  let selectedLanguage: string;
  let terminalEnabled = true;
  let paperclipEnabled = false;
  let avatarEnabled = false; // Toggle for woman portrait
  let terminalText = ''; // Add new variable for terminal text
  let settingsOpen = false; // Toggle for settings popup
  let selectedSystemPrompt = ''; // Selected system prompt from dropdown
  let editedSystemPrompt = ''; // Editable version of the selected prompt

  // Initialize with values from configuration store
  $: selectedLLM = $configuration?.llm || 'gemma-3';
  $: selectedLanguage = $configuration?.lang || 'en';
  $: selectedSystemPrompt = $configuration?.systemPrompt || '';
  $: editedSystemPrompt = selectedSystemPrompt; // Update edited prompt when selected prompt changes

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

  // Update configuration when LLM selection changes
  $: if (selectedLLM && $configuration) {
    if ($configuration.llm !== selectedLLM) {
      configuration.update(config => ({
        ...config,
        llm: selectedLLM
      }));
    }
  }

  // Update configuration when language selection changes
  $: if (selectedLanguage && $configuration) {
    if ($configuration.lang !== selectedLanguage) {
      configuration.update(config => ({
        ...config,
        lang: selectedLanguage
      }));
    }
  }

  // Update configuration when system prompt selection changes
  $: if (selectedSystemPrompt && $configuration) {
    if ($configuration.systemPrompt !== selectedSystemPrompt) {
      // Update the edited prompt when a new prompt is selected from dropdown
      editedSystemPrompt = selectedSystemPrompt;
      
      configuration.update(config => ({
        ...config,
        systemPrompt: selectedSystemPrompt
      }));
    }
  }

  // No longer needed as bind:value handles the update
  // function updateSystemPrompt(prompt: string) {
  //   if ($configuration && $configuration.systemPrompt !== prompt) {
  //     configuration.update(config => ({
  //       ...config,
  //       systemPrompt: prompt
  //     }));
  //     settingsOpen = false; // Close the settings popup after selection
  //   }
  // }
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
      class:active={settingsOpen}
      onclick={() => settingsOpen = !settingsOpen}
      aria-label="Settings"
    >
      ⚙️
    </button>

    <!-- Add the separator element -->
    <span class="toolbar-separator"></span>

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

    <!-- Add the separator element -->
    <span class="toolbar-separator"></span>

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

  {#if settingsOpen}
    <div class="settings-popup">
      <div class="settings-content">
        <h3>Settings</h3>
        
        <!-- System Prompt Dropdown -->
        <div class="setting-item">
          <label for="system-prompt-select">Prompt:</label>
          <select id="system-prompt-select" bind:value={selectedSystemPrompt} class="system-prompt-select">
            <!-- Add a default/empty option if needed -->
            <option value="" disabled={selectedSystemPrompt !== ''}>-- Select a prompt --</option> 
            {#each systemPrompts as promptOption}
              <option value={promptOption.prompt}>{promptOption.name}</option>
            {/each}
          </select>
        </div>

        <!-- Display Editable Prompt Text -->
        {#if selectedSystemPrompt}
          <textarea 
            bind:value={editedSystemPrompt} 
            class="prompt-text editable-prompt" 
            rows="8"
          ></textarea>
        {/if}

        <button 
          class="close-button" 
          onclick={() => {
            // Apply the edited prompt to the configuration when closing
            if (editedSystemPrompt !== $configuration.systemPrompt) {
              configuration.update(config => ({
                ...config,
                systemPrompt: editedSystemPrompt
              }));
            }
            settingsOpen = false;
          }}
        >
          Close
        </button>
      </div>
    </div>
  {/if}

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

  /* Style for the vertical separator */
  .toolbar-separator {
    display: inline-block; /* Allows setting width/height */
    width: 1px; /* Thickness of the separator */
    background-color: var(--separator-color, #ccc); /* Use a CSS variable for color */
    height: 1.5rem; /* Adjust height to match button content area */
    /* Optional: Adjust margin if the default gap isn't sufficient */
    /* margin: 0 0.25rem; */ 
    vertical-align: middle; /* Align vertically with buttons */
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

  .settings-popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1002;
  }

  .settings-content {
    background-color: #2d2d2d;
    padding: 1.5rem;
    border-radius: 0.5rem;
    width: 80%;
    max-width: 600px; /* Increased max-width for better layout */
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex; /* Use flexbox for layout */
    flex-direction: column; /* Stack items vertically */
    gap: 1rem; /* Add space between items */
  }

  .settings-content h3 {
    margin-top: 0;
    margin-bottom: 0.5rem; /* Reduced margin */
    font-size: 1.2rem;
    text-align: center; /* Center title */
  }

  /* Style for individual setting items */
  .setting-item {
    display: flex;
    /* Changed from column to row to place items side-by-side */
    flex-direction: row; 
    /* Align items vertically in the center */
    align-items: center; 
    gap: 0.75rem; /* Add some space between label and select */
  }

  .setting-item label {
    font-weight: bold;
    /* Prevent label from shrinking */
    flex-shrink: 0; 
  }

  /* Style for the system prompt dropdown */
  .system-prompt-select {
    /* Removed width: 100% */
    /* Allow the select box to grow and fill available space */
    flex: 1; 
    box-sizing: border-box; /* Include padding/border in width */
  }

  .prompt-text {
    background-color: #f9f9f9;
    border: 1px solid #eee;
    border-radius: 0.25rem;
    padding: 0.75rem;
    white-space: pre-wrap; /* Wrap long lines */
    word-wrap: break-word; /* Break long words */
    font-family: monospace;
    font-size: 0.9em;
    max-height: 200px; /* Limit height and allow scrolling if needed */
    overflow-y: auto;
    color: #333; /* Text color for light mode */
    text-align: left;
    width: 100%;
    box-sizing: border-box;
  }

  .editable-prompt {
    resize: vertical;
    min-height: 150px;
  }

  .close-button {
    padding: 0.6rem 1.2rem; /* Slightly larger padding */
    background-color: #e6e6e6; /* Lighter grey */
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    cursor: pointer;
    font-weight: bold;
    align-self: flex-end; /* Align button to the right */
    margin-top: 1rem; /* Space above the button */
    color: black;
  }

  .close-button:hover {
    background-color: #dcdcdc;
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

  /* Dark theme adjustments */
  :global([data-theme="dark"]) {
    --toolbar-bg: #2d2d2d;
    --select-bg: #383838;
    --select-border: #555;
    --select-text: #e0e0e0; /* Lighter text for dark mode */
    --button-bg: #383838;
    --button-border: #555;
    --button-active-bg: #3b9dff;
    --button-active-border: #2d6dad;
    --button-hover-bg: #454545;

    .settings-content {
      background-color: #2d2d2d; /* Dark background for popup */
      color: var(--select-text); /* Use theme text color */
    }

    .settings-content h3 {
      color: #f0f0f0; /* Lighter heading */
    }
    
    .setting-item label {
      color: #cccc; /* Lighter label */
    }

    .system-prompt-select {
      background: var(--select-bg);
      color: var(--select-text);
      border-color: var(--select-border);
    }

    .prompt-text {
      background-color: #383838; /* Darker background */
      border-color: #555; /* Darker border */
      color: #e0e0e0; /* Lighter text */
    }

    .editable-prompt {
      background-color: #383838;
      color: #e0e0e0;
    }

    .close-button {
      background-color: #454545;
      border-color: #555;
      color: #e0e0e0;
    }

    .close-button:hover {
      background-color: #505050;
    }

    .terminal-textarea {
      background: var(--select-bg);
      color: var(--select-text); /* Ensure terminal uses theme text color */
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