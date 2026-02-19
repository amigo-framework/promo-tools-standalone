<script lang="ts">
  import { onMount } from 'svelte';
  
  export let visible = false;
  export let title = '';
  export let message = '';
  export let showCloseButton = true;
  export let width = 400;
  export let height = 300;
  export let backgroundColor = '#1a1a2e';
  export let borderColor = '#ff6b35';
  export let textColor = '#ffffff';
  
  onMount(() => {
    console.log('[POPUP] PopupOverlay mounted with props:', { visible, title, message, width, height, backgroundColor });
  });
  
  $: console.log('[POPUP] visible changed to:', visible);
  
  function close() {
    visible = false;
  }
  
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      visible = false;
    }
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      visible = false;
    }
  }
</script>

{#if visible}
  <div 
    class="overlay-backdrop"
    on:click={handleBackdropClick}
  >
    <div 
      class="popup-container"
      role="dialog"
      aria-modal="true"
      on:keydown={handleKeydown}
      tabindex="-1"
      style="
        width: {width}px; 
        height: {height}px; 
        background-color: {backgroundColor};
        border: 2px solid {borderColor};
        color: {textColor};
      "
    >
      {#if showCloseButton}
        <button class="close-button" on:click={close}>×</button>
      {/if}
      
      {#if title}
        <h2 class="popup-title">{title}</h2>
      {/if}
      
      {#if message}
        <div class="popup-message">{@html message}</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .overlay-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }
  
  .popup-container {
    position: relative;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    padding: 20px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
  }
  
  .close-button {
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    font-size: 24px;
    color: inherit;
    cursor: pointer;
    z-index: 1;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  }
  
  .close-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .popup-title {
    margin: 0 30px 15px 0;
    font-size: 24px;
    font-weight: bold;
    text-align: center;
  }
  
  .popup-message {
    flex: 1;
    font-size: 16px;
    line-height: 1.5;
    text-align: center;
    overflow-y: auto;
  }
</style>