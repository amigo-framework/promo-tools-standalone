<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { IConnector, Campaign } from '../interfaces/IPromoTool';
  import { findMinimalQualifyingBet } from '../shared/findMinimalQualifyingBet';
  import promoTopCounterTournament from '../assets/promo/promo_top_counter_tournament.png';

  export let connector: IConnector;
  export let campaign: Campaign;
  export let config: any = null;
  export let campaignState: any = null;
  export let playerState: any = null;
  export let visible = true;
  export let style: string = '';

  const dispatch = createEventDispatcher();

  $: playerRank = getPlayerPosition(campaignState, playerState);
  $: totalPositions = getTotalPositions(campaignState);
  $: rankText = playerRank > 0 ? `${playerRank}/${totalPositions}` : totalPositions > 0 ? `-/${totalPositions}` : '-';
  $: minimalQualifyingBet = findMinimalQualifyingBet(connector?.bets, playerState);
  $: currentBet = connector?.getCurrentBetAmount?.();
  $: isInactive = currentBet !== undefined && minimalQualifyingBet !== undefined && currentBet < (playerState?.exchangedQualifyingBet || 0);
  $: widgetIndex = parseInt(style.match(/--widget-index:\s*(\d+)/)?.[1] || '0');

  function getPlayerPosition(campaignState: any, playerState: any): number {
    const roundIds = campaignState?.leaderboard?.roundIds || [];
    const playerRoundId = playerState?.leaderboardRoundId;
    
    if (!Array.isArray(roundIds) || playerRoundId == null) {
      return 0;
    }
    
    const rankIndex = roundIds.findIndex((roundId: string) => roundId === playerRoundId);
    return rankIndex >= 0 ? rankIndex + 1 : 0;
  }

  function getTotalPositions(campaignState: any): number {
    const roundIds = campaignState?.leaderboard?.roundIds || [];
    return Array.isArray(roundIds) ? roundIds.length : 0;
  }

  function handleClick() {
    console.log('[TournamentWidget] handleClick called!');
    console.log('[TournamentWidget] connector:', !!connector);
    console.log('[TournamentWidget] campaign:', campaign?.campaignId);
    console.log('[TournamentWidget] window.openTournamentPopup available:', typeof (window as any).openTournamentPopup);
    
    // Open the Tournament Terms & Conditions directly
    if (typeof window !== 'undefined' && (window as any).openTournamentPopup) {
      console.log('[TournamentWidget] Calling openTournamentPopup for terms...');
      (window as any).openTournamentPopup(connector, campaign, 'terms', {
        config,
        campaignState,
        playerState
      })
        .then((result: {action: string}) => {
          console.log('[TournamentWidget] Popup result:', result);
          // Dispatch the original event for any other listeners
          dispatch('click', result);
        })
        .catch((error: any) => {
          console.error('[TournamentWidget] Error opening popup:', error);
          dispatch('click', {action: 'error'});
        });
    } else {
      console.warn('[TournamentWidget] openTournamentPopup not available, using fallback');
      // Fallback to dispatch
      dispatch('click');
    }
  }

  function tr(key: string, opts?: Record<string, any>): string {
    const i18nCandidates = [
      (window as any)?.i18next,
      (window as any)?.__i18next,
      (window as any)?.I18NEXT,
      (connector as any)?.i18next,
      (connector as any)?.locale?.i18next,
    ].filter(Boolean);

    for (const i18n of i18nCandidates) {
      if (i18n?.t) {
        const value = i18n.t(key, opts);
        if (typeof value === 'string' && value !== key) {
          return value;
        }
      }
    }

    return key;
  }
</script>

{#if visible}
  <div 
    class="promo-widget {isInactive ? 'inactive' : ''}"
    transition:fade={{ duration: 200 }}
    on:click={(e) => {
      console.log('[TournamentWidget] Click event detected!', e);
      e.stopPropagation();
      handleClick();
    }}
    on:keydown={(e) => e.key === 'Enter' && handleClick()}
    on:touchstart={() => console.log('[TournamentWidget] Touch start detected')}
    on:touchend={() => console.log('[TournamentWidget] Touch end detected')}
    role="button"
    tabindex="0"
    aria-label="Tournament Widget"
    style="pointer-events: auto !important;"
  >
    <img src={promoTopCounterTournament} alt="Tournament Counter" class="widget-image" />
    <div class="widget-overlay">
      <div class="widget-counter">{rankText}</div>
      <div class="widget-label">{tr('tournamentHeaderRank')}</div>
    </div>
    
    {#if isInactive && minimalQualifyingBet}
      <div class="widget-warning">
        <div class="warning-text">
          {tr('tournamentRulesQualifyingBetMessage')} {connector.formatCurrency(minimalQualifyingBet)}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .promo-widget {
    position: fixed;
    top: calc(20px + var(--widget-index, 0) * 80px);
    left: 20px;
    z-index: 999998;
    cursor: pointer;
    transition: transform 0.2s ease;
    user-select: none;
  }

  .promo-widget:hover {
    transform: scale(1.05);
  }

  .promo-widget:active {
    transform: scale(0.95);
  }

  .promo-widget.inactive {
    opacity: 0.7;
  }

  .widget-image {
    display: block;
    width: auto;
    height: 60px;
    user-select: none;
    pointer-events: none;
  }

  .widget-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .widget-counter {
    font-family: 'Roboto-Bold', Arial, sans-serif;
    font-size: 18px;
    font-weight: 900;
    color: #ffffff;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    -webkit-text-stroke: 0.5px #000000;
    line-height: 1;
    margin-bottom: 2px;
  }

  .widget-label {
    font-family: 'Roboto', Arial, sans-serif;
    font-size: 10px;
    font-weight: 600;
    color: #ffffff;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    text-transform: uppercase;
    line-height: 1;
  }

  .widget-warning {
    position: absolute;
    top: -30px;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    white-space: nowrap;
    animation: fadeInOut 3s ease-in-out infinite;
  }

  .warning-text {
    font-weight: 600;
  }

  @keyframes fadeInOut {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .promo-widget {
      top: calc(10px + var(--widget-index, 0) * 70px);
      left: 10px;
    }
    
    .widget-image {
      height: 50px;
    }
    
    .widget-counter {
      font-size: 16px;
    }
    
    .widget-label {
      font-size: 9px;
    }
    
    .widget-warning {
      top: -25px;
      font-size: 9px;
      padding: 3px 6px;
    }
  }

  /* Small mobile - horizontal layout */
  @media (max-width: 480px) {
    .promo-widget {
      top: 10px;
      left: calc(10px + var(--widget-index, 0) * 70px);
    }
    
    .widget-image {
      height: 40px;
    }
    
    .widget-counter {
      font-size: 14px;
    }
    
    .widget-label {
      font-size: 8px;
    }
    
    .widget-warning {
      top: -20px;
      font-size: 8px;
      padding: 2px 5px;
    }
  }
</style>