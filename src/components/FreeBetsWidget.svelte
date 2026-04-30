<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { IConnector, Campaign } from '../interfaces/IPromoTool';
  import promoTopCounterBets from '../assets/promo/promo_top_counter_bets.png';

  export let connector: IConnector;
  export let campaign: Campaign;
  export let config: any = null;
  export let playerState: any = null;
  export let visible = true;
  export let style: string = '';

  const dispatch = createEventDispatcher();

  $: freeBetsCount = config && typeof config.bets === 'number' ? Math.max(0, config.bets - (playerState?.used || 0)) : (playerState?.available || 0);
  $: widgetIndex = parseInt(style.match(/--widget-index:\s*(\d+)/)?.[1] || '0');
  $: totalWin = playerState?.totalWin || 0;
  $: showWinBadge = totalWin > 0;

  function formatCurrency(value: number): string {
    if (connector?.formatCurrency) {
      return connector.formatCurrency(value);
    }
    return value.toFixed(2);
  }

  function handleClick() {
    console.log('[FreeBetsWidget] handleClick called!');
    console.log('[FreeBetsWidget] connector:', !!connector);
    console.log('[FreeBetsWidget] campaign:', campaign?.campaignId);
    console.log('[FreeBetsWidget] window.openFreeBetsPopup available:', typeof (window as any).openFreeBetsPopup);
    
    // Open the FreeBets popup directly
    if (typeof window !== 'undefined' && (window as any).openFreeBetsPopup) {
      console.log('[FreeBetsWidget] Calling openFreeBetsPopup...');
      (window as any).openFreeBetsPopup(connector, campaign, 'active')
        .then((result: {action: string}) => {
          console.log('[FreeBetsWidget] Popup result:', result);
          // Dispatch the original event for any other listeners
          dispatch('click', result);
        })
        .catch((error: any) => {
          console.error('[FreeBetsWidget] Error opening popup:', error);
          dispatch('click', {action: 'error'});
        });
    } else {
      console.warn('[FreeBetsWidget] openFreeBetsPopup not available, using fallback');
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
    class="promo-widget"
    transition:fade={{ duration: 200 }}
    on:click={(e) => {
      console.log('[FreeBetsWidget] Click event detected!', e);
      e.stopPropagation();
      handleClick();
    }}
    on:keydown={(e) => e.key === 'Enter' && handleClick()}
    on:touchstart={() => console.log('[FreeBetsWidget] Touch start detected')}
    on:touchend={() => console.log('[FreeBetsWidget] Touch end detected')}
    role="button"
    tabindex="0"
    aria-label="Free Bets Widget"
    style="pointer-events: auto !important;"
  >
    <img src={promoTopCounterBets} alt="Free Bets Counter" class="widget-image" />
    <div class="widget-overlay">
      <div class="widget-counter">{freeBetsCount}</div>
      <div class="widget-label">{tr('freeBets')}</div>
    </div>
    {#if showWinBadge}
      <div class="win-badge" transition:fade={{ duration: 300 }}>
        <div class="win-amount">+{formatCurrency(totalWin)}</div>
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
    margin-left: 20px;
  }

  .widget-counter {
    font-family: 'Roboto-Bold', Arial, sans-serif;
    font-size: 25px;
    font-weight: 900;
    color: #ffffff;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    -webkit-text-stroke: 0.5px #000000;
    line-height: 1;
    margin-bottom: 2px;
  }

  .widget-label {
    font-family: 'Roboto', Arial, sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #ffffff;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    text-transform: uppercase;
    line-height: 1;
  }

  .win-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
    border: 2px solid #ffffff;
    border-radius: 12px;
    padding: 4px 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 12px rgba(255, 215, 0, 0.6);
    animation: pulse 2s ease-in-out infinite;
    pointer-events: none;
  }

  .win-amount {
    font-family: 'Roboto-Bold', Arial, sans-serif;
    font-size: 12px;
    font-weight: 900;
    color: #000000;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
    white-space: nowrap;
    line-height: 1;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 12px rgba(255, 215, 0, 0.6);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 215, 0, 0.8);
    }
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

    .win-badge {
      top: -6px;
      right: -6px;
      padding: 3px 6px;
    }

    .win-amount {
      font-size: 10px;
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

    .win-badge {
      top: -5px;
      right: -5px;
      padding: 2px 5px;
      border-radius: 10px;
    }

    .win-amount {
      font-size: 9px;
    }
  }
</style>