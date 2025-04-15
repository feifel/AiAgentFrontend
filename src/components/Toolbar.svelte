<script lang="ts">
  import avatarIcon from '../assets/avatar.png';

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
  let microphoneEnabled = false;
  let speakerEnabled = false;
  let terminalEnabled = false;
  let paperclipEnabled = false;
  let screenEnabled = false; // New toggle for computer screen
  let avatarEnabled = false; // Toggle for woman portrait
</script>

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
    class:active={microphoneEnabled} 
    onclick={() => microphoneEnabled = !microphoneEnabled}
  >
    🎤
  </button>

  <button 
    class="toggle-button" 
    class:active={screenEnabled}
    onclick={() => screenEnabled = !screenEnabled}
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

  <button 
    class="toggle-button" 
    class:active={speakerEnabled}
    onclick={() => speakerEnabled = !speakerEnabled}
  >
    🔊
  </button>
</div>

<style>
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

  /* Removed unused selectors for layout dropdown */

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
  }
</style>