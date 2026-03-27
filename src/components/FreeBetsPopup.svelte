<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { IConnector, Campaign } from '../interfaces/IPromoTool';
  import promoTopFreespin from '../assets/promo/promo_top_freespin.png';
  import promoBottom from '../assets/promo/promo_bottom.png';
  import promoBoxSmall from '../assets/promo/promo_box_small.png';
  import promoGreenBtnNormal from '../assets/buttons/promo_green_btn_normal.png';
  import promoGreenBtnHover from '../assets/buttons/promo_green_btn_hover.png';
  import promoGreenBtnDown from '../assets/buttons/promo_green_btn_down.png';
  import promoRedBtnNormal from '../assets/buttons/promo_red_btn_normal.png';
  import promoRedBtnHover from '../assets/buttons/promo_red_btn_hover.png';
  import promoRedBtnDown from '../assets/buttons/promo_red_btn_down.png';
  import promoBanner from '../assets/promo/promo_banner.png';
  import promoBoxLarge from '../assets/promo/promo_box_large.png';

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
  let showTermsAndConditions = false;
  let termsActiveTab = 'terms'; // 'terms' or 'conditions'

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

  async function handleOptOut(event?: MouseEvent) {
    if (event) event.stopPropagation(); // Prevent event bubbling
    console.log('[FreeBetsPopup] handleOptOut called, closePromoOptOut setting:', connector.settings?.closePromoOptOut);
    
    if (connector.settings?.closePromoOptOut !== 'true') {
      console.log('[FreeBetsPopup] Making optCampaign call with optIn=false for campaign:', campaign.campaignId);
      await connector.optCampaign(campaign.campaignId, false);
      console.log('[FreeBetsPopup] optCampaign call completed, dispatching buttonClick with optOut action');
      visible = false;
      dispatch('buttonClick', { action: 'optOut' });
      return;
    }

    console.log('[FreeBetsPopup] Close mode active, just closing popup without opt out');
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

  function openTermsAndConditions() {
    showTermsAndConditions = true;
  }

  function closeTermsAndConditions() {
    showTermsAndConditions = false;
    termsActiveTab = 'terms';
  }

  function switchToTermsTab() {
    termsActiveTab = 'terms';
  }

  function switchToConditionsTab() {
    termsActiveTab = 'conditions';
  }

  // Public method to close popup (can be called by connector)
  export function closePopup() {
    console.log('[FreeBetsPopup] closePopup() called externally');
    if (showTermsAndConditions) {
      closeTermsAndConditions();
    } else {
      visible = false;
    }
  }
</script>

{#if !loading && visible && !showTermsAndConditions}
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
      <div class="promo-image-container">
        <img class="promo-image-top" src={promoTopFreespin} alt="" aria-hidden="true" />
        <img class="promo-image-bottom" src={promoBoxSmall} alt="" aria-hidden="true" />
      </div>
      <div class="promo-image-overlay-content">
          <div class="promo-fs-hero" aria-label="Remaining free spins">
            {freeBetsCount}
          </div>
        <div
          id="popup-title"
          class="promo-title"
        >
          {title}
        </div>
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

        <button type="button" class="promo-terms-link" on:click|stopPropagation={openTermsAndConditions}>
          {tr('freeBetsStartedTermsAndConditionsMessage')}
        </button>
      </div>

      <div class="promo-actions">
        {#if showOptOutButton}
          <button
            class="promo-image-button secondary"
            on:click={handleOptOut}
          >
            <img class="normal" src={promoRedBtnNormal} alt="" aria-hidden="true" />
            <img class="hover" src={promoRedBtnHover} alt="" aria-hidden="true" />
            <img class="down" src={promoRedBtnDown} alt="" aria-hidden="true" />
            <span class="promo-image-button-label">{secondaryButtonLabel}</span>
          </button>
        {/if}
        <button
          class="promo-image-button"
          on:click={handleStart}
        >
          <img class="normal" src={promoGreenBtnNormal} alt="" aria-hidden="true" />
          <img class="hover" src={promoGreenBtnHover} alt="" aria-hidden="true" />
          <img class="down" src={promoGreenBtnDown} alt="" aria-hidden="true" />
          <span class="promo-image-button-label">{primaryButtonLabel}</span>
        </button>
      </div>
    </section>
  </div>
{/if}

<!-- Terms and Conditions Box -->
{#if !loading && visible && showTermsAndConditions}
  <div 
    class="promo-modal-overlay"
    style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2147483647 !important; pointer-events: auto;"
    transition:fade={{ duration: 200 }}
  >
    <section class="promo-terms-popup" role="dialog" aria-modal="true">
      <div class="promo-terms-container">
        <img class="promo-terms-banner" src={promoBanner} alt="" aria-hidden="true" />
        <div class="promo-terms-content">
          <img class="promo-terms-box" src={promoBoxLarge} alt="" aria-hidden="true" />
          <div class="promo-terms-overlay">
            <div class="promo-terms-tabs">
              <button 
                class="promo-terms-tab {termsActiveTab === 'terms' ? 'active' : ''}"
                on:click={switchToTermsTab}
              >
                Terms
              </button>
              <button 
                class="promo-terms-tab {termsActiveTab === 'conditions' ? 'active' : ''}"
                on:click={switchToConditionsTab}
              >
                Conditions
              </button>
            </div>
            
            <div class="promo-terms-text">
              {#if termsActiveTab === 'terms'}
                <div class="promo-terms-content-text">
                  <h3>Free Bets Terms</h3>
                  <p><strong>How it works:</strong></p>
                  <ul>
                    <li>You have {freeBetsCount} free bets available</li>
                    <li>Each free bet is worth {connector.formatCurrency(freeBetsAmount)}</li>
                    <li>Use your free bets within the promotional period</li>
                    <li>Winnings from free bets will be credited to your account</li>
                  </ul>
                  
                  <p><strong>Important Notes:</strong></p>
                  <ul>
                    <li>Free bets cannot be withdrawn as cash</li>
                    <li>Only winnings from successful free bets are withdrawable</li>
                    <li>Free bets must be used in full - no partial amounts</li>
                    <li>Unused free bets will expire at the end of the promotion</li>
                  </ul>
                </div>
              {:else}
                <div class="promo-terms-content-text">
                  <h3>Terms and Conditions</h3>
                  <p><strong>General Conditions:</strong></p>
                  <ul>
                    <li>This promotion is available to eligible players only</li>
                    <li>Standard terms and conditions apply</li>
                    <li>The operator reserves the right to modify or cancel this promotion</li>
                    <li>Participants must be of legal gambling age</li>
                  </ul>
                  
                  <p><strong>Disputes:</strong></p>
                  <p>Any disputes regarding this promotion will be resolved in accordance with our standard terms of service.</p>
                  
                  {#if campaign.end}
                    <p><strong>Promotion ends:</strong> {new Date(campaign.end).toLocaleString()}</p>
                  {/if}
                </div>
              {/if}
            </div>
            
            <button class="promo-terms-close" on:click={closeTermsAndConditions}>
              ×
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
{/if}

<style>
:root{--primary-color: #7D4CDB;--background-front: #FFFFFF;--background-back: #EDEDED;--text-color: #000000;--secondary-text-color: #666666;--overlay-background: rgba(0, 0, 0, .5)}
body.dark-theme{--primary-color: #7D4CDB;--background-front: #222222;--background-back: #333333;--text-color: #FFFFFF;--secondary-text-color: #CCCCCC}
.promo-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:var(--overlay-background);display:flex;align-items:center;justify-content:center;z-index:999999 !important}
.promo-image-popup{position:relative;width:600px;height:470px;border-radius:10px;box-shadow:0 8px 22px rgba(0,0,0,.35);font-family:Helvetica,Arial,sans-serif;background:transparent;transform-origin:center center}
.promo-image-container{position:relative;width:400px;height:470px;display:flex;flex-direction:column;transform:translateY(-10px)}
.promo-image-top{display:block;width:400px;height:auto;object-fit:contain;flex-shrink:0;aspect-ratio:925/681;margin:0 auto;position:relative;z-index:2}
.promo-image-bottom{display:block;width:600px;height:auto;object-fit:contain;flex-shrink:0;aspect-ratio:925/352;margin:0 auto;transform:translateY(-100px)}
.promo-image-overlay-content{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.35));padding:20px;color:#fff;pointer-events:none}
.promo-fs-hero{position:absolute;left:55%;top:110px;transform:translateX(-50%);font-size:88px;line-height:1;font-weight:900;color:#fff;-webkit-text-stroke:2px #d4af37;text-shadow:0 2px 6px rgba(0,0,0,.55),0 0 6px rgba(212,175,55,.35)}
.promo-title{position:absolute;left:50%;top:173px;width:360px;margin:0;transform:translateX(-50%);text-align:center;font-family:'Roboto-Bold',sans-serif;font-size:20px;font-weight:bolder;line-height:1.05;color:#ffff00;-webkit-text-stroke:0.5px #000000}
.promo-image-message{position:absolute;left:50%;top:213px;width:360px;transform:translateX(-50%);text-align:center;font-weight:600;font-size:12px;color:#ffff00;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.promo-end-date{position:absolute;left:50%;top:389px;width:360px;transform:translateX(-50%);text-align:center;font-size:8px;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.promo-actions{position:absolute;left:50%;right:auto;bottom:12px;display:flex;justify-content:center;gap:4px;padding:0 7px;transform:translateX(-50%)}
.promo-image-button{position:relative;border:0;background:transparent;padding:0;cursor:pointer;min-width:60px;pointer-events:auto;width:60px;height:auto}
.promo-image-button img{display:block;width:60px;height:auto;user-select:none;pointer-events:none}
.promo-image-button img.hover{display:none}
.promo-image-button img.down{display:none}

.promo-terms-link{position:absolute;left:50%;top:403px;transform:translateX(-50%);background:transparent;border:0;color:#fff;text-decoration:underline dotted;cursor:pointer;font-size:7px;font-weight:600;pointer-events:auto}

/* Terms and Conditions Box Styles */
.promo-terms-popup{position:relative;width:500px;height:400px;border-radius:10px;overflow:hidden;box-shadow:0 8px 22px rgba(0,0,0,.35);font-family:Helvetica,Arial,sans-serif;background:transparent;transform-origin:center center}
.promo-terms-container{position:relative;width:500px;height:400px;display:flex;flex-direction:column}
.promo-terms-banner{display:block;width:500px;height:auto;object-fit:contain;flex-shrink:0;aspect-ratio:925/189}
.promo-terms-content{position:relative;flex:1;display:flex;flex-direction:column;min-height:0}
.promo-terms-box{display:block;width:600px;height:auto;object-fit:contain;flex:1;min-height:0;margin:0 auto}
.promo-terms-overlay{position:absolute;inset:0;padding:15px;color:#000;display:flex;flex-direction:column}
.promo-terms-tabs{display:flex;gap:10px;margin-bottom:15px;justify-content:center;flex-shrink:0}
.promo-terms-tab{background:#f0f0f0;border:1px solid #ccc;padding:6px 12px;cursor:pointer;border-radius:4px;font-size:11px;font-weight:600;transition:all 0.2s}
.promo-terms-tab.active{background:#7D4CDB;color:white;border-color:#7D4CDB}
.promo-terms-tab:hover{background:#e0e0e0}
.promo-terms-tab.active:hover{background:#6a4cbf}
.promo-terms-text{flex:1;overflow-y:auto;padding:10px 15px;background:transparent;border-radius:8px;margin:5px 10px;min-height:0}
.promo-terms-content-text{font-size:11px;line-height:1.4;color:#ffffff;font-family:Arial,sans-serif}
.promo-terms-content-text h3{margin:0 0 8px 0;font-size:12px;color:#ffffff;font-weight:bold}
.promo-terms-content-text p{margin:0 0 8px 0}
.promo-terms-content-text ul{margin:3px 0 10px 0;padding-left:16px}
.promo-terms-content-text li{margin-bottom:3px}
.promo-terms-content-text strong{color:#ffffff;font-weight:600}
.promo-terms-close{position:absolute;top:8px;right:12px;background:rgba(0,0,0,0.7);color:white;border:none;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:16px;font-weight:bold;display:flex;align-items:center;justify-content:center;transition:background 0.2s;flex-shrink:0}
.promo-terms-close:hover{background:rgba(0,0,0,0.9)}
.promo-image-button:hover img.normal{display:none}
.promo-image-button:hover img.hover{display:block}
.promo-image-button:active img.normal,
.promo-image-button:active img.hover{display:none}
.promo-image-button:active img.down{display:block}
.promo-image-button-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Roboto',Arial,sans-serif;font-size:9px;font-weight:900;letter-spacing:.2px;text-transform:uppercase;color:#000000 !important}
.promo-image-button.secondary .promo-image-button-label{color:#000000 !important}
.promo-info-grid{display:flex;justify-content:center;align-items:center;gap:25px;position:absolute;left:50%;top:315px;width:max-content;transform:translateX(-50%);margin:0}
.promo-info-card{background:transparent;padding:0;border-radius:0;text-align:center;backdrop-filter:none}
.promo-info-label{font-size:9px;color:#fff;opacity:.95;margin-bottom:3px}
.promo-info-value{font-size:20px;font-weight:700;color:#fff}
/* Responsive scaling */
@media (min-width: 700px) and (max-width: 1199px) {
  .promo-image-popup {
    transform: scale(1.2);
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .promo-image-popup {
    transform: scale(1.4);
  }
}

@media (min-width: 1600px) {
  .promo-image-popup {
    transform: scale(1.6);
  }
}

@media (min-width: 2000px) {
  .promo-image-popup {
    transform: scale(1.8);
  }
}

@media (max-width: 399px) {
  .promo-image-popup {
    transform: scale(0.9);
  }
}

@media (max-height: 470px) {
  .promo-image-popup {
    transform: scale(0.8);
  }
}

@media (max-height: 368px) {
  .promo-image-popup {
    transform: scale(0.7);
  }
}

@media (max-width: 320px) or (max-height: 300px) {
  .promo-image-popup {
    transform: scale(0.6);
  }
}
</style>
