<script lang="ts">
  import { onDestroy } from 'svelte';
  import FreeBetsWidget from './FreeBetsWidget.svelte';
  import PrizeDropWidget from './PrizeDropWidget.svelte';
  import TournamentWidget from './TournamentWidget.svelte';
  import type { IConnector, Campaign } from '../interfaces/IPromoTool';

  export let connector: IConnector;

  let activeWidgets: Array<{
    type: 'freeBets' | 'prizeDrop' | 'tournament';
    campaign: Campaign;
    config: any;
    campaignState: any;
    playerState: any;
  }> = [];

  // Public methods to manage widgets
  export function addPromoWidget(
    type: 'freeBets' | 'prizeDrop' | 'tournament',
    campaign: Campaign,
    config: any,
    campaignState: any,
    playerState: any
  ) {
    console.log('[WidgetManager] addPromoWidget called:', {
      type,
      campaign: campaign?.campaignId,
      config: !!config,
      campaignState: !!campaignState,
      playerState: !!playerState
    });
    
    // Remove existing widget of same type
    removePromoWidget(type);
    
    // Add new widget
    activeWidgets = [...activeWidgets, {
      type,
      campaign,
      config,
      campaignState,
      playerState
    }];
    
    console.log('[WidgetManager] Active widgets count:', activeWidgets.length);
  }

  export function removePromoWidget(type: 'freeBets' | 'prizeDrop' | 'tournament') {
    activeWidgets = activeWidgets.filter(widget => widget.type !== type);
  }

  export function updatePromoWidget(
    type: 'freeBets' | 'prizeDrop' | 'tournament',
    campaign: Campaign,
    config: any,
    campaignState: any,
    playerState: any
  ) {
    const widgetIndex = activeWidgets.findIndex(widget => widget.type === type);
    if (widgetIndex >= 0) {
      activeWidgets[widgetIndex] = {
        type,
        campaign,
        config,
        campaignState,
        playerState
      };
      // Trigger reactivity
      activeWidgets = [...activeWidgets];
    }
  }

  export function clearAllWidgets() {
    activeWidgets = [];
  }

  // Handle widget clicks
  function handleFreeBetsClick(campaign: Campaign, config: any, campaignState: any, playerState: any) {
    console.log('[WidgetManager] FreeBets widget clicked');
    // Dispatch event or call popup directly
    const event = new CustomEvent('showFreeBetsPopup', {
      detail: { campaign, config, campaignState, playerState }
    });
    window.dispatchEvent(event);
  }

  function handlePrizeDropClick(campaign: Campaign, config: any, campaignState: any, playerState: any) {
    console.log('[WidgetManager] PrizeDrop widget clicked');
    // Dispatch event or call popup directly  
    const event = new CustomEvent('showPrizeDropRules', {
      detail: { campaign, config, campaignState, playerState }
    });
    window.dispatchEvent(event);
  }

  function handleTournamentClick(campaign: Campaign, config: any, campaignState: any, playerState: any) {
    console.log('[WidgetManager] Tournament widget clicked');
    // Widget handles popup directly, just log
  }

  onDestroy(() => {
    clearAllWidgets();
  });
</script>

<!-- Render active widgets with proper positioning -->
{#each activeWidgets as widget, index}
  {#if widget.type === 'freeBets'}
    <FreeBetsWidget
      {connector}
      campaign={widget.campaign}
      config={widget.config}
      playerState={widget.playerState}
      style="--widget-index: {index};"
      on:click={() => handleFreeBetsClick(widget.campaign, widget.config, widget.campaignState, widget.playerState)}
    />
  {:else if widget.type === 'prizeDrop'}
    <PrizeDropWidget
      {connector}
      campaign={widget.campaign}
      config={widget.config}
      campaignState={widget.campaignState}
      playerState={widget.playerState}
      style="--widget-index: {index};"
      on:click={() => handlePrizeDropClick(widget.campaign, widget.config, widget.campaignState, widget.playerState)}
    />
  {:else if widget.type === 'tournament'}
    <TournamentWidget
      {connector}
      campaign={widget.campaign}
      config={widget.config}
      campaignState={widget.campaignState}
      playerState={widget.playerState}
      style="--widget-index: {index};"
      on:click={() => handleTournamentClick(widget.campaign, widget.config, widget.campaignState, widget.playerState)}
    />
  {/if}
{/each}

<style>
  /* Widget manager doesn't need its own styles - widgets handle their own positioning */
</style>