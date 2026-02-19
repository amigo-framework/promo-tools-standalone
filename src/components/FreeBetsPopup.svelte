<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { IConnector, Campaign } from '../interfaces/IPromoTool';
  import freeBetsImage from '../assets/promo/freebets.png';
  import btnGreenNormal from '../assets/buttons/btn_green_normal.png';
  import btnGreenHover from '../assets/buttons/btn_green_hover.png';
  import btnGreenDown from '../assets/buttons/btn_green_down.png';
  import btnRedNormal from '../assets/buttons/btn_red_normal.png';
  import btnRedHover from '../assets/buttons/btn_red_hover.png';
  import btnRedDown from '../assets/buttons/btn_red_down.png';

  // Export props with defaults
  export let connector: IConnector;
  export let campaign: Campaign;
  export let mode: 'started' | 'active' | 'finished' | 'prizeWon' = 'started';
  export let prizeWonData: any = null;

  const dispatch = createEventDispatcher();
  let visible = false;
  let loading = true;
  let config: any = null;
  let playerState: any = null;

  onMount(async () => {
    try {
      console.log('[FreeBetsPopup] onMount called, mode:', mode, 'campaign:', campaign);
      const data = await connector.getCampaign(campaign.campaignId, true);
      console.log('[FreeBetsPopup] Campaign data received:', data);
      console.log('[FreeBetsPopup] Config:', data.config);
      console.log('[FreeBetsPopup] PlayerState:', data.playerState);
      config = data.config;
      playerState = data.playerState;
      
      // Apply freezeBet callback for active/started campaigns
      if (mode === 'started' || mode === 'active') {
        connector.callbacks?.freezeBet && connector.callbacks.freezeBet(playerState.amount);
      }
      
      // Stop autoplay for finished campaigns
      if (mode === 'finished') {
        connector.callbacks?.stopAutoplay && connector.callbacks.stopAutoplay();
      }
      
      loading = false;
      visible = true;
      console.log('[FreeBetsPopup] Popup should now be visible, visible:', visible, 'loading:', loading);
      
      // Check after a moment if it's still visible
      setTimeout(() => {
        console.log('[FreeBetsPopup] 🚨 CACHE BUSTER v3.4 FRESH BUILD 🚨🚨🚨 - After 500ms - visible:', visible, 'loading:', loading);
        const overlay = document.querySelector('.promo-modal-overlay');
        console.log('[FreeBetsPopup] 🚨 CACHE BUSTER v3.4 FRESH BUILD 🚨🚨🚨 - Overlay element exists:', !!overlay);
        if (overlay) {
          const styles = window.getComputedStyle(overlay);
          console.log('[FreeBetsPopup] 🚨 CACHE BUSTER v3.4 FRESH BUILD 🚨🚨🚨 - Z-INDEX SHOULD BE 2147483647, ACTUAL:', styles.zIndex, 'display:', styles.display, 'opacity:', styles.opacity);
          console.log('[FreeBetsPopup] Overlay position:', styles.position, 'top:', styles.top, 'left:', styles.left);
          console.log('[FreeBetsPopup] Overlay classList:', overlay.classList.toString());
          
          // Check if CSS is loaded by looking for the style tag
          const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
          console.log('[FreeBetsPopup] Style tags found:', styleTags.length);
          const promoStyles = styleTags.filter(tag => {
            if (tag.tagName === 'LINK') {
              return (tag as HTMLLinkElement).href.includes('style.css');
            }
            return tag.textContent?.includes('promo-modal-overlay');
          });
          console.log('[FreeBetsPopup] Promo style tags:', promoStyles.length);
        }
      }, 500);
    } catch (error) {
      console.error('[FreeBetsPopup] Error in onMount:', error);
      loading = false;
      visible = true; // Show popup anyway
    }
  });

  onDestroy(() => {
    console.log('[FreeBetsPopup] Component is being destroyed!');
  });

  $: title = getTitle();
  $: message = getMessage(config, playerState, mode);
  $: freeBetsCount = config ? (config.bets - (playerState?.used || 0)) : 0;
  $: freeBetsAmount = playerState?.amount || config?.amount || 0;
  $: freeBetsLabel = tr('freeBetsSpins');
  $: betAmountLabel = tr('betAmount');
  $: {
    console.log('[FreeBetsPopup] 🔥 Reactive values updated:', {
      freeBetsCount,
      freeBetsAmount,
      'config.bets': config?.bets,
      'playerState.used': playerState?.used,
      calculation: config ? `${config.bets} - ${playerState?.used || 0} = ${config.bets - (playerState?.used || 0)}` : 'no config',
      playerState,
      config,
      mode
    });
  }
  $: primaryButtonLabel = mode === 'started' ? tr('start') : tr('continue');
  $: secondaryButtonLabel = connector.settings?.closePromoOptOut === 'true' ? tr('close') : tr('optOut');
  $: showOptOutButton = mode === 'started' && connector.settings?.hidePromoOptOut !== 'true';
  let primaryButtonState: 'normal' | 'hover' | 'down' = 'normal';
  let secondaryButtonState: 'normal' | 'hover' | 'down' = 'normal';

  function tr(key: string, opts?: Record<string, any>): string {
    const i18n = (window as any)?.i18next;
    if (i18n?.t) {
      const value = i18n.t(key, opts);
      if (typeof value === 'string' && value !== key) {
        return value;
      }
      if (typeof value === 'string') {
        return value;
      }
    }
    return key;
  }

  function getTitle(): string {
    if (mode === 'finished') return tr('freeBetsFinishedTitle');
    if (mode === 'active') return tr('freeBetsActiveTitle');
    return tr('freeBetsIntroTitle');
  }

  function getPrimaryButtonImage(): string {
    if (primaryButtonState === 'down') return btnGreenDown;
    if (primaryButtonState === 'hover') return btnGreenHover;
    return btnGreenNormal;
  }

  function getSecondaryButtonImage(): string {
    if (secondaryButtonState === 'down') return btnRedDown;
    if (secondaryButtonState === 'hover') return btnRedHover;
    return btnRedNormal;
  }

  function getMessage(config: any, playerState: any, mode: string): string {
    if (mode === 'finished') {
      const usedBets = playerState?.used || 0;
      const totalWin = playerState?.totalWin || 0;
      return tr('freeBetsFinishedMessage', {
        spins: usedBets,
        win: connector.formatCurrency(totalWin),
      });
    }
    if (mode === 'active') {
      return tr('freeBetsActiveMessage');
    }
    // mode === 'started'
    const spins = config?.bets || 0;
    const bet = config?.amount || playerState?.amount || 0;
    return tr('freeBetsIntroMessage', {
      spins,
      bet: connector.formatCurrency(bet),
    });
  }

  function handleOptOut(event?: MouseEvent) {
    if (event) event.stopPropagation(); // Prevent event bubbling
    console.log('[FreeBetsPopup] handleOptOut called');
    visible = false;
    setTimeout(() => {
      console.log('[FreeBetsPopup] Dispatching close event');
      dispatch('close');
    }, 200);
  }

  async function handleStart(event: MouseEvent) {
    event.stopPropagation(); // Prevent event bubbling to backdrop
    event.preventDefault(); // Prevent any default behavior
    console.log('[FreeBetsPopup] handleStart called, mode:', mode);

    // In active mode, close the popup without sending buttonClick to connector
    // to avoid React promo UI race conditions.
    if (mode === 'active') {
      visible = false;
      setTimeout(() => {
        console.log('[FreeBetsPopup] Dispatching close event (active mode)');
        dispatch('close');
      }, 0);
      return;
    }

    // In started mode we need opt-in + button action semantics.
    if (mode === 'started') {
      await connector.optCampaign(campaign.campaignId, true);
      connector.callbacks?.freezeBet && connector.callbacks.freezeBet(playerState.amount);
    }

    console.log('[FreeBetsPopup] Dispatching buttonClick event');
    dispatch('buttonClick');
  }

  function handleBackdropClick(event: MouseEvent) {
    console.log('[FreeBetsPopup] handleBackdropClick called');
    if (event.target === event.currentTarget && showOptOutButton) {
      handleOptOut();
    }
  }

  // Public method to close popup (can be called by connector)
  export function closePopup() {
    console.log('[FreeBetsPopup] closePopup() called externally');
    visible = false;
  }
</script>

{#if !loading && visible}
  <div 
    class="promo-modal-overlay"
    style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2147483647 !important; pointer-events: auto;"
    transition:fade={{ duration: 200 }}
  >
    <section
      class="promo-image-popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <img class="promo-image-base" src={freeBetsImage} alt="" aria-hidden="true" />
      <div class="promo-image-overlay-content">
          <div class="promo-fs-hero" aria-label="Remaining free spins">
            {freeBetsCount}
          </div>
        <h3
          id="popup-title"
          class="promo-title"
        >
          {title}
        </h3>
        <div class="promo-image-message">{message}</div>

        <div class="promo-info-grid">
          <div class="promo-info-card">
            <div class="promo-info-label">{freeBetsLabel}</div>
            <div class="promo-info-value">{freeBetsCount}</div>
          </div>
          <div class="promo-info-card">
            <div class="promo-info-label">{betAmountLabel}</div>
            <div class="promo-info-value">{connector.formatCurrency(freeBetsAmount)}</div>
          </div>
        </div>

        {#if campaign.end}
          <div class="promo-end-date">
            {tr('freeBetsStartedEndDateMessage')}<b>{new Date(campaign.end).toLocaleString()}</b>
          </div>
        {/if}
      </div>

      <div class="promo-actions">
        {#if showOptOutButton}
          <button
            class="promo-image-button"
            on:mouseenter={() => (secondaryButtonState = 'hover')}
            on:mouseleave={() => (secondaryButtonState = 'normal')}
            on:mousedown={() => (secondaryButtonState = 'down')}
            on:mouseup={() => (secondaryButtonState = 'hover')}
            on:touchstart={() => (secondaryButtonState = 'down')}
            on:touchend={() => (secondaryButtonState = 'normal')}
            on:click={handleOptOut}
          >
            <img class="promo-image-button-bg" src={getSecondaryButtonImage()} alt="" aria-hidden="true" />
            <span class="promo-image-button-label">{secondaryButtonLabel}</span>
          </button>
        {/if}
        <button
          class="promo-image-button"
          on:mouseenter={() => (primaryButtonState = 'hover')}
          on:mouseleave={() => (primaryButtonState = 'normal')}
          on:mousedown={() => (primaryButtonState = 'down')}
          on:mouseup={() => (primaryButtonState = 'hover')}
          on:touchstart={() => (primaryButtonState = 'down')}
          on:touchend={() => (primaryButtonState = 'normal')}
          on:click={handleStart}
        >
          <img class="promo-image-button-bg" src={getPrimaryButtonImage()} alt="" aria-hidden="true" />
          <span class="promo-image-button-label">{primaryButtonLabel}</span>
        </button>
      </div>
    </section>
  </div>
{/if}

<style>
:root{--primary-color: #7D4CDB;--background-front: #FFFFFF;--background-back: #EDEDED;--text-color: #000000;--secondary-text-color: #666666;--overlay-background: rgba(0, 0, 0, .5)}
body.dark-theme{--primary-color: #7D4CDB;--background-front: #222222;--background-back: #333333;--text-color: #FFFFFF;--secondary-text-color: #CCCCCC}
.promo-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:var(--overlay-background);display:flex;align-items:center;justify-content:center;z-index:999999 !important}
.promo-image-popup{position:relative;width:min(92vw,700px);border-radius:10px;overflow:hidden;box-shadow:0 8px 22px rgba(0,0,0,.35);font-family:Helvetica,Arial,sans-serif;background:transparent}
.promo-image-base{display:block;width:100%;height:auto;max-height:85vh;object-fit:contain}
.promo-image-overlay-content{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.35));padding:20px;color:#fff;pointer-events:none}
.promo-fs-hero{position:absolute;left:50%;top:22%;transform:translateX(-50%);font-size:88px;line-height:1;font-weight:900;color:#fff;-webkit-text-stroke:2px #d4af37;text-shadow:0 2px 6px rgba(0,0,0,.55),0 0 6px rgba(212,175,55,.35)}
.promo-title{position:absolute;left:50%;top:43%;width:calc(100% - 40px);margin:0;transform:translateX(-50%);text-align:center;font-size:28px;line-height:1.05;text-shadow:0 2px 4px rgba(0,0,0,.6)}
.promo-image-message{position:absolute;left:50%;top:52%;width:calc(100% - 40px);transform:translateX(-50%);text-align:center;font-weight:600;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.promo-end-date{position:absolute;left:50%;top:72%;width:calc(100% - 40px);transform:translateX(-50%);text-align:center;font-size:14px;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.promo-actions{position:absolute;left:50%;right:auto;bottom:41px;display:flex;justify-content:center;gap:14px;padding:0 14px;transform:translateX(-50%)}
.promo-image-button{position:relative;border:0;background:transparent;padding:0;cursor:pointer;min-width:122px}
.promo-image-button-bg{display:block;width:122px;height:auto;user-select:none;pointer-events:none}
.promo-image-button-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;text-shadow:0 1px 2px rgba(0,0,0,.5)}
.promo-info-grid{display:flex;justify-content:center;align-items:center;gap:50px;position:absolute;left:50%;top:58%;width:max-content;transform:translateX(-50%);margin:0}
.promo-info-card{background:transparent;padding:0;border-radius:0;text-align:center;backdrop-filter:none}
.promo-info-label{font-size:12px;color:#fff;opacity:.95;margin-bottom:6px}
.promo-info-value{font-size:22px;font-weight:700;color:#fff}
@media (max-width: 768px){.promo-image-popup{width:95vw}.promo-image-base{max-height:88vh}.promo-image-overlay-content{inset:0;padding:14px}.promo-fs-hero{top:10%;font-size:34px;-webkit-text-stroke:1.5px #d4af37}.promo-title{top:22%;width:calc(100% - 24px);font-size:22px}.promo-image-message{top:39%;width:calc(100% - 24px)}.promo-info-grid{top:58%;gap:28px}.promo-end-date{top:70%;width:calc(100% - 24px)}.promo-actions{gap:8px;bottom:58px}.promo-image-button,.promo-image-button-bg{width:96px;min-width:96px}.promo-image-button-label{font-size:12px}}
</style>
