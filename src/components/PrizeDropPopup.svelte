<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { IConnector, Campaign } from '../interfaces/IPromoTool';
  import promoTopPrize from '../assets/promo/promo_top_prize.png';
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
  import tabBtnLargeNormal from '../assets/buttons/tab_btn_large_normal.png';
  import tabBtnLargeHover from '../assets/buttons/tab_btn_large_hover.png';
  import tabBtnLargeDown from '../assets/buttons/tab_btn_large_down.png';
  import neutralBtnNormal from '../assets/buttons/neutral_btn_normal.png';
  import neutralBtnHover from '../assets/buttons/neutral_btn_hover.png';
  import neutralBtnDown from '../assets/buttons/neutral_btn_down.png';

  export let connector: IConnector;
  export let campaign: Campaign;
  export let mode: 'started' | 'active' | 'finished' | 'prizeWon' = 'started';
  export let prizeWonData: any = null;

  const dispatch = createEventDispatcher();
  let visible = false;
  let loading = true;
  let config: any = null;
  let campaignState: any = null;
  let playerState: any = null;
  let showTermsAndConditions = false;
  let termsActiveTab = 'terms'; // 'terms' or 'conditions'

  onMount(async () => {
    try {
      visible = true; // Show immediately
      console.log('[PrizeDropPopup] campaign prop received:', campaign);

      if (mode === 'prizeWon') {
        loading = false;
        return;
      }

      const data = await connector.getCampaign(campaign.campaignId, true);
      console.log('[PrizeDropPopup] getCampaign payload received:', data);
      config = data.config;
      campaignState = data.campaignState;
      playerState = data.playerState;
      console.log('[PrizeDropPopup] state assigned:', {
        config,
        campaignState,
        playerState,
      });
      loading = false;
    } catch (error) {
      console.error('[PrizeDropPopup] Error in onMount:', error);
      loading = false;
      visible = true; // Show even on error for testing
    }
  });

  $: title = getTitle();
  $: message = getMessage();
  $: effectiveConfig = config || (campaign as any)?.config || null;
  $: effectiveCampaignState = campaignState || (campaign as any)?.campaignState || null;
  $: effectivePlayerState = playerState || (campaign as any)?.playerState || null;
  $: prizesToShow = Array.isArray(getPrizesToShow(effectiveConfig, effectiveCampaignState)) ? getPrizesToShow(effectiveConfig, effectiveCampaignState) : [];
  $: prizesNotShownLeft = getPrizesNotShownLeft(prizesToShow, effectiveCampaignState);
  $: summaryPrizeValue = getSummaryPrizeValue(prizesToShow, effectiveConfig, effectiveCampaignState, effectivePlayerState);
  $: finishedTotalWonValue = getFinishedTotalWonValue(effectivePlayerState);
  $: minimalQualifyingBet = findMinimalQualifyingBet(connector.bets, effectivePlayerState);
  $: primaryButtonLabel = mode === 'finished'
    ? tr('prizeDropFinishedAcknowledgeButton')
    : mode === 'prizeWon'
      ? tr('prizeDropWinAcknowledgeButton')
      : tr('start');
  $: secondaryButtonLabel = connector.settings?.closePromoOptOut === 'true' ? tr('close') : tr('optOut');
  $: showOptOutButton = mode === 'started' && connector.settings?.hidePromoOptOut !== 'true';

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

  function getTitle(): string {
    if (mode === 'prizeWon') return tr('prizeDropWinTitle');
    if (mode === 'finished') return tr('prizeDropFinishedTitle');
    return tr('prizeDropStartedTitle');
  }

  function getMessage(): string {
    if (mode === 'prizeWon' && prizeWonData) {
      return tr('prizeDropWinMessage');
    }
    if (mode === 'finished') return tr('prizeDropFinishedMessage');
    return tr('prizeDropStartedMessage');
  }

  function getPrizesToShow(currentConfig: any, currentCampaignState: any) {
    if (!currentConfig?.prizes || !Array.isArray(currentConfig.prizes) || !currentConfig.prizes.length) {
      return [];
    }
    return currentConfig.prizes
      .map((prize: any, index: number) => ({
        ...prize,
        prizeIndex: index,
        amountLeft: Number(currentCampaignState?.amountsLeft?.[index] ?? prize.amount ?? 0),
      }))
      .filter((detailedPrize: any) => detailedPrize.amountLeft > 0);
  }

  function getPrizesNotShownLeft(visiblePrizes: any[], currentCampaignState: any): number {
    const amountsLeft = Array.isArray(currentCampaignState?.amountsLeft) ? currentCampaignState.amountsLeft : [];
    if (!amountsLeft.length) return 0;
    const totalLeft = amountsLeft.reduce((sum: number, amountLeft: number) => sum + amountLeft, 0);
    const shownLeft = Array.isArray(visiblePrizes) ? visiblePrizes.reduce((sum: number, detailedPrize: any) => sum + (detailedPrize.amountLeft || 0), 0) : 0;
    return totalLeft - shownLeft;
  }

  function findMinimalQualifyingBet(bets: any, currentPlayerState: any): number | undefined {
    let minBet: number | undefined;
    for (const { available } of Object.values(bets || {} as any)) {
      if (Array.isArray(available)) {
        const min = [...available].sort((a, b) => a - b).find((bet) => bet >= currentPlayerState?.exchangedQualifyingBet);
        if (min != null) minBet = Math.min(minBet ?? min, min);
      } else if (available && typeof available === 'object') {
        let min = available.min;
        while (min <= available.max) {
          if (min >= currentPlayerState?.exchangedQualifyingBet) {
            minBet = Math.min(minBet ?? min, min);
            break;
          }
          min = parseFloat((min + available.step).toFixed(2));
        }
      }
    }
    return minBet;
  }

  function getSummaryPrizeValue(_visiblePrizes: any[], currentConfig: any, currentCampaignState: any, currentPlayerState: any): string {
    const prizes = Array.isArray(currentConfig?.prizes) ? currentConfig.prizes : [];
    if (!prizes.length) return '0x:$0.00';

    const amountsLeft = Array.isArray(currentCampaignState?.amountsLeft) ? currentCampaignState.amountsLeft : [];
    const activeIndex = amountsLeft.findIndex((value: number) => Number(value) > 0);
    const index = activeIndex >= 0 ? activeIndex : 0;
    const prize = prizes[index] || prizes[0];

    const count = Number(amountsLeft[index] ?? prize?.amount ?? 0);
    const rawUnit = currentPlayerState?.exchangedCashValues?.[index] ?? prize?.value ?? 0;

    const unitValue = prize?.type === 'cash'
      ? safeFormatCurrency(rawUnit)
      : prize?.type === 'multiplier'
        ? `${prize.value}x ${tr('bet').toLowerCase()}`
        : String(prize?.value ?? '');

    const summary = `${count}x:${unitValue}`;
    console.log('[PrizeDropPopup] summary value computed from real data:', {
      index,
      prize,
      amountsLeft,
      rawUnit,
      count,
      unitValue,
      summary,
      effectiveConfig: currentConfig,
      effectiveCampaignState: currentCampaignState,
      effectivePlayerState: currentPlayerState,
    });
    return summary;
  }

  function safeFormatCurrency(value: number): string {
    try {
      return connector.formatCurrency(value);
    } catch (_error) {
      const symbol = (connector.settings as any)?.currencySymbol || '$';
      const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
      return `${symbol}${amount.toFixed(2)}`;
    }
  }

  function getPrizeUnitValue(prize: any, index: number): string {
    if (prize.type === 'cash') {
      const raw = effectivePlayerState?.exchangedCashValues?.[index] ?? effectiveCampaignState?.exchangedCashValues?.[index] ?? prize.value ?? 0;
      return safeFormatCurrency(raw);
    }

    if (prize.type === 'multiplier') {
      return `${prize.value}x ${tr('bet').toLowerCase()}`;
    }

    return String(prize.value ?? '');
  }

  function renderPrizeValue(prize: any, index: number): string {
    if (prize.type === 'cash') return getPrizeUnitValue(prize, index);
    if (prize.type === 'multiplier') {
      const limit = prize.limit ? ` (${tr('prizeDropCappedAt')} ${safeFormatCurrency(effectivePlayerState?.exchangedLimits?.[index] ?? 0)})` : '';
      return `${prize.value}x ${tr('bet').toLowerCase()}${limit}`;
    }
    return String(prize.value ?? '');
  }

  function getPrizeWonValue(): string {
    if (!prizeWonData) return '';
    if (prizeWonData.type === 'cash') {
      return safeFormatCurrency(prizeWonData.exchangedCashValue ?? prizeWonData.amount ?? 0);
    }
    if (prizeWonData.type === 'multiplier') {
      const limit = prizeWonData.exchangedLimit ? ` (${tr('prizeDropCappedAt')} ${safeFormatCurrency(prizeWonData.exchangedLimit)})` : '';
      return `${safeFormatCurrency(prizeWonData.exchangedCashValue ?? 0)} (${prizeWonData.value}x ${tr('bet').toLowerCase()}${limit})`;
    }
    return String(prizeWonData.value ?? '');
  }

  function getFinishedTotalWonValue(currentPlayerState: any): string {
    const prizesWon = Array.isArray(currentPlayerState?.prizesWon) ? currentPlayerState.prizesWon : [];
    const totalWon = prizesWon.reduce((sum: number, prize: any) => {
      const value = Number(prize?.exchangedCashValue ?? prize?.cashValue ?? 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    return safeFormatCurrency(totalWon);
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

  function getTermsContent() {
    const prizes = Array.isArray(effectiveConfig?.prizes) ? effectiveConfig.prizes : [];
    const rulesPrizeLines = prizes.map((prize: any, index: number) => {
      const amountLeft = effectiveCampaignState?.amountsLeft?.[index] ?? 0;
      const rowLabel = tr('prizeDropStartedPrizesLeftMessage', {
        amountLeft,
        totalAmount: prize.amount,
      });
      return `${rowLabel}: ${renderPrizeValue(prize, index)}`;
    });

    const qualifyingLine = minimalQualifyingBet != null
      ? `${tr('prizeDropRulesQualifyingBetMessage')}${safeFormatCurrency(minimalQualifyingBet)}`
      : '';

    const endDateLine = campaign.end
      ? `${tr('prizeDropStartedEndDateMessage')}${new Date(campaign.end).toLocaleString()}`
      : '';

    return [
      tr('prizeDropRulesPrizesMessage'),
      ...rulesPrizeLines,
      qualifyingLine,
      endDateLine,
      '',
      tr('prizeDropRulesOtherMessage'),
    ].filter(Boolean).join('\n');
  }

  async function handleOptOut() {
    console.log('[PrizeDropPopup] handleOptOut called, closePromoOptOut setting:', connector.settings?.closePromoOptOut);
    
    if (connector.settings?.closePromoOptOut !== 'true') {
      console.log('[PrizeDropPopup] Making optCampaign call with optIn=false for campaign:', campaign.campaignId);
      await connector.optCampaign(campaign.campaignId, false);
      console.log('[PrizeDropPopup] optCampaign call completed, dispatching buttonClick with optOut action');
      visible = false;
      dispatch('buttonClick', { action: 'optOut' });
      return;
    }

    console.log('[PrizeDropPopup] Close mode active, just closing popup without opt out');
    visible = false;
    setTimeout(() => dispatch('close'), 200);
  }

  async function handleStart() {
    console.log('[PrizeDropPopup] handleStart click, mode:', mode);

    if (mode === 'started') {
      await connector.optCampaign(campaign.campaignId, true);
      visible = false;
      dispatch('buttonClick', { action: 'start' });
      return;
    }

    visible = false;

    if (mode === 'active') {
      setTimeout(() => dispatch('close'), 0);
      return;
    }

    // For prizeWon/finished we must acknowledge deterministically.
    dispatch('buttonClick');
  }
</script>

{#if !loading && visible && !showTermsAndConditions}
  <div 
    class="promo-modal-overlay"
    transition:fade={{ duration: 200 }}
  >
    <section
      class="promo-image-popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <div class="promo-images-container">
        <img class="promo-image-top" src={promoTopPrize} alt="" aria-hidden="true" />
        <img class="promo-image-bottom" src={promoBoxSmall} alt="" aria-hidden="true" />
      </div>
      <div class="promo-image-overlay-content">
        <div id="popup-title" class="promo-title" class:prize-won={mode === 'prizeWon'} class:finished={mode === 'finished'}>{title}</div>
        <div class="promo-image-message" class:finished={mode === 'finished'}>{message}</div>

        {#if mode === 'prizeWon'}
          <div class="promo-win-value">{getPrizeWonValue()}</div>
        {/if}

        {#if mode === 'finished'}
          <div class="promo-win-value finished">{finishedTotalWonValue}</div>
        {/if}

        {#if mode === 'started' || mode === 'active'}
          {#if minimalQualifyingBet != null}
            <div class="promo-qualifying-bet">
              {tr('prizeDropStartedQualifyingBetMessage')}<b>{safeFormatCurrency(minimalQualifyingBet)}</b>
            </div>
          {/if}
        {/if}

        {#if mode === 'started' || mode === 'active'}
          <div class="promo-prizes-list">
            {#each (Array.isArray(prizesToShow) ? prizesToShow : []) as prize, index}
              <div class="promo-prize-item">
                <span class="promo-prize-left">
                  {tr('prizeDropStartedPrizesLeftMessage', { 
                    amountLeft: prize.amountLeft, 
                    totalAmount: prize.amount 
                  })}:
                </span>
                <span class="promo-prize-value">{renderPrizeValue(prize, prize.prizeIndex)}</span>
              </div>
            {/each}
          </div>
        {/if}

        {#if campaign.end && (mode === 'started' || mode === 'active')}
          <div class="promo-end-date">
            {tr('prizeDropStartedEndDateMessage')}<b>{new Date(campaign.end).toLocaleString()}</b>
          </div>
        {/if}

        {#if mode === 'started' || mode === 'active'}
          <button type="button" class="promo-terms-link" on:click|stopPropagation={openTermsAndConditions}>
            {tr('prizeDropStartedTermsAndConditionsMessage')}
          </button>
        {/if}
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
        <div class="promo-banner-wrapper">
          <img class="promo-terms-banner" src={promoBanner} alt="" aria-hidden="true" />
          <div class="promo-banner-title">Terms and Conditions</div>
        </div>
        <div class="promo-terms-content">
          <img class="promo-terms-box" src={promoBoxLarge} alt="" aria-hidden="true" />
          <div class="promo-terms-overlay">
            <div class="promo-terms-tabs">
              <button 
                class="promo-terms-tab {termsActiveTab === 'terms' ? 'active' : ''}"
                on:click={switchToTermsTab}
              >
                <img class="normal" src={tabBtnLargeNormal} alt="" aria-hidden="true" />
                <img class="hover" src={tabBtnLargeHover} alt="" aria-hidden="true" />
                <img class="down" src={tabBtnLargeDown} alt="" aria-hidden="true" />
                <span class="tab-label">Terms</span>
              </button>
              <button 
                class="promo-terms-tab {termsActiveTab === 'conditions' ? 'active' : ''}"
                on:click={switchToConditionsTab}
              >
                <img class="normal" src={tabBtnLargeNormal} alt="" aria-hidden="true" />
                <img class="hover" src={tabBtnLargeHover} alt="" aria-hidden="true" />
                <img class="down" src={tabBtnLargeDown} alt="" aria-hidden="true" />
                <span class="tab-label">Conditions</span>
              </button>
            </div>
            
            <div class="promo-terms-text">
              {#if termsActiveTab === 'terms'}
                <div class="promo-terms-content-text">
                  <h3>Prize Drop Rules</h3>
                  <div class="terms-content">
                    {@html getTermsContent().replace(/\n/g, '<br>')}
                  </div>
                </div>
              {:else}
                <div class="promo-terms-content-text">
                  <h3>Terms and Conditions</h3>
                  <p><strong>General Conditions:</strong></p>
                  <ul>
                    <li>This promotion is available to eligible players only</li>
                    <li>Prizes are awarded randomly during gameplay</li>
                    <li>Standard terms and conditions apply</li>
                    <li>The operator reserves the right to modify or cancel this promotion</li>
                  </ul>
                  
                  <p><strong>Prize Conditions:</strong></p>
                  <ul>
                    <li>Prizes must be claimed within the promotional period</li>
                    <li>Cash prizes are credited directly to your account</li>
                    <li>Some prizes may have additional wagering requirements</li>
                  </ul>
                  
                  {#if campaign.end}
                    <p><strong>Promotion ends:</strong> {new Date(campaign.end).toLocaleString()}</p>
                  {/if}
                </div>
              {/if}
            </div>
            
            <button class="promo-terms-close" on:click={closeTermsAndConditions}>
              <img class="normal" src={neutralBtnNormal} alt="" aria-hidden="true" />
              <img class="hover" src={neutralBtnHover} alt="" aria-hidden="true" />
              <img class="down" src={neutralBtnDown} alt="" aria-hidden="true" />
              <span class="close-label">Close</span>
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
.promo-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:var(--overlay-background);display:flex;align-items:center;justify-content:center;z-index:999999 !important;pointer-events:auto !important}
.promo-image-popup{position:relative;width:600px;height:467px;border-radius:10px;box-shadow:0 8px 22px rgba(0,0,0,.35);font-family:Helvetica,Arial,sans-serif;background:transparent;pointer-events:auto;transform-origin:center center}
.promo-images-container{display:flex;flex-direction:column;width:600px;height:467px;transform:translateY(-7px)}

.promo-image-top{display:block;width:400px;height:auto;object-fit:contain;flex-shrink:0;aspect-ratio:925/681;margin:0 auto;position:relative;z-index:2;transform:translateY(-50px)}
.promo-image-bottom{display:block;width:600px;height:auto;object-fit:contain;flex-shrink:0;aspect-ratio:925/352;margin:0 auto;transform:translateY(-100px)}
.promo-image-overlay-content{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.35));padding:20px;color:#fff;pointer-events:none}
.promo-title{position:absolute;left:50%;top:36%;width:calc(100% - 40px);margin:0;transform:translateX(-50%);text-align:center;font-size:37px;font-weight:1000;line-height:1.05;background:linear-gradient(180deg,#ffff00,#ffa500);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;-webkit-text-stroke:2px #000000}
.promo-title.prize-won{font-size:25px;top:37%}
.promo-title.finished{font-size:23px;top:178px}
.promo-image-message{position:absolute;left:50%;top:219px;width:360px;transform:translateX(-50%);text-align:center;font-weight:600;font-size:11px;color:#ffff00;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.promo-image-message.finished{top:260px}
.promo-win-value{position:absolute;left:50%;top:237px;width:360px;transform:translateX(-50%);text-align:center;font-size:16px;color:#ffffff;-webkit-text-stroke:0.1px #ee141a}
.promo-win-value.finished{top:280px}
.prize-text-small{position:relative;font-family:'Roboto-Bold',sans-serif;font-weight:bolder;display:inline-block;color:#ffffff;-webkit-text-stroke:0.1px #ee141a}
.promo-qualifying-bet{position:absolute;left:50%;top:356px;width:360px;transform:translateX(-50%);text-align:center;font-size:7px;text-shadow:0 1px 2px rgba(0,0,0,.7)}
.promo-prizes-list{position:absolute;left:50%;top:229px;width:300px;max-width:300px;transform:translateX(-50%);border-radius:4px;padding:6px 8px;display:grid;grid-template-columns:1fr 1fr;gap:2px 0px;max-height:95px;overflow-y:auto}
.promo-prize-item{display:flex;flex-direction:row;justify-content:center;align-items:center;margin-bottom:0;font-size:10px;line-height:1.1;font-family:'Roboto',Arial,sans-serif;font-weight:900;gap:2px;box-sizing:border-box;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.promo-prize-item:last-child{margin-bottom:0}
.promo-prize-left{color:#ffffff;-webkit-text-stroke:0.1px #ee141a;text-align:center}
.promo-prize-value{color:#ffffff;-webkit-text-stroke:0.1px #ee141a;text-align:center;font-weight:bold}
.promo-prize-more{justify-content:center;font-style:italic;color:#ddd}
.promo-end-date{position:absolute;left:50%;top:368px;width:360px;transform:translateX(-50%);text-align:center;font-size:7px;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.promo-terms-link{position:absolute;left:50%;top:380px;transform:translateX(-50%);background:transparent;border:0;color:#fff;text-decoration:underline dotted;cursor:pointer;font-size:7px;font-weight:600;pointer-events:auto}
.promo-actions{position:absolute;left:50%;right:auto;bottom:37px;display:flex;justify-content:center;gap:4px;padding:0 7px;transform:translateX(-50%);pointer-events:auto}
.promo-image-button{position:relative;border:0;background:transparent;padding:0;cursor:pointer;min-width:60px;pointer-events:auto;width:60px;height:auto}
.promo-image-button img{display:block;width:60px;height:auto;user-select:none;pointer-events:none}
.promo-image-button img.hover{display:none}
.promo-image-button img.down{display:none}
.promo-image-button:hover img.normal{display:none}
.promo-image-button:hover img.hover{display:block}
.promo-image-button:active img.normal,
.promo-image-button:active img.hover{display:none}
.promo-image-button:active img.down{display:block}
.promo-image-button-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Roboto',Arial,sans-serif;font-size:9px;font-weight:900;letter-spacing:.2px;text-transform:uppercase;color:#ffffff !important}
.promo-image-button.secondary .promo-image-button-label{color:#ffffff !important}
/* Responsive scaling  */
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

@media (max-height: 460px) {
  .promo-image-popup {
    transform: scale(0.8);
  }
}

@media (max-height: 368px) {
  .promo-image-popup {
    transform: scale(0.7);
  }
}

@media (max-width: 300px) or (max-height: 280px) {
  .promo-image-popup {
    transform: scale(0.6);
  }
}

/* Terms and Conditions Box Styles */
.promo-terms-popup{position:relative;width:1260px;height:730px;border-radius:16px;box-shadow:0 12px 33px rgba(0,0,0,.35);font-family:Helvetica,Arial,sans-serif;background:transparent;transform-origin:center center}
.promo-terms-container{position:relative;width:1260px;height:730px;display:flex;flex-direction:column}
.promo-terms-banner{display:block;width:840px;height:auto;object-fit:contain;flex-shrink:0;aspect-ratio:925/189;margin:0 auto;z-index:10;position:relative}
.promo-banner-wrapper{position:relative;display:flex;justify-content:center}
.promo-banner-title{position:absolute;top:38%;left:50%;transform:translate(-50%,-50%);font-size:23px;font-weight:bold;color:#ffffff;text-align:center;z-index:11;text-shadow:2px 2px 4px rgba(0,0,0,0.7);text-transform:uppercase}
.promo-terms-content{position:relative;flex:1;display:flex;flex-direction:column;min-height:0;transform:translateY(-65px)}
.promo-terms-box{display:block;width:700px !important;height:auto;max-width:none !important;flex:1;min-height:0;margin:0 auto}
.promo-terms-overlay{position:absolute;inset:0;padding:21px;color:#000;display:flex;flex-direction:column;width:700px;margin:0 auto}
.promo-terms-tabs{display:flex;gap:10px;margin-bottom:15px;justify-content:center;flex-shrink:0;margin-top:20px}
.promo-terms-tab{position:relative;border:none;background:transparent;padding:8px;cursor:pointer;transition:all 0.2s;margin:0 auto;pointer-events:auto;border-radius:8px}
.promo-terms-tab img{display:block;width:50%;height:auto;user-select:none;pointer-events:none;margin:0 auto}
.promo-terms-tab img.hover{display:none}
.promo-terms-tab img.down{display:none}
.promo-terms-tab.active img.normal{display:none !important}
.promo-terms-tab.active img.hover{display:none !important}
.promo-terms-tab.active img.down{display:block !important}
.promo-terms-tab:not(.active):hover img.normal{display:none !important}
.promo-terms-tab:not(.active):hover img.hover{display:block !important}
.promo-terms-tab:not(.active):hover img.down{display:none !important}
.tab-label{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:12px;font-weight:600;color:#ffffff;pointer-events:none;text-align:center;z-index:1}
.promo-terms-text{flex:1;overflow-y:auto;padding:10px 15px;background:transparent;border-radius:8px;margin:5px 10px;min-height:0}
.promo-terms-content-text{font-size:11px;line-height:1.4;color:#ffffff;font-family:Arial,sans-serif}
.promo-terms-content-text h3{margin:0 0 8px 0;font-size:12px;color:#ffffff;font-weight:bold}
.promo-terms-content-text p{margin:0 0 8px 0}
.promo-terms-content-text ul{margin:3px 0 10px 0;padding-left:16px}
.promo-terms-content-text li{margin-bottom:3px}
.promo-terms-content-text strong{color:#ffffff;font-weight:600}
.terms-content{background:transparent;padding:8px;border-radius:4px;white-space:pre-line}
.promo-terms-close{position:absolute;bottom:-9px;left:50%;transform:translateX(-50%);background:transparent;border:none;cursor:pointer;transition:all 0.2s;flex-shrink:0;padding:0}
.promo-terms-close img{display:block;width:40%;height:auto;user-select:none;pointer-events:none;margin:0 auto}
.promo-terms-close img.hover{display:none}
.promo-terms-close img.down{display:none}
.promo-terms-close:hover img.normal{display:none}
.promo-terms-close:hover img.hover{display:block}
.promo-terms-close:active img.normal, .promo-terms-close:active img.hover{display:none}
.promo-terms-close:active img.down{display:block}
.close-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#ffffff;pointer-events:none;text-transform:uppercase}

/* Media queries for responsive T&C popup scaling */
@media (max-width: 1599px) {
  .promo-terms-popup { width: 1050px; height: 625px; border-radius: 13px; }
  .promo-terms-container { width: 1050px; height: 625px; }
  .promo-terms-banner { width: 630px; }
  .promo-terms-box { width: 520px !important; }
  .promo-terms-overlay { width: 520px; padding: 19px; }
  .promo-terms-content { transform: translateY(-52px); }
}

@media (max-width: 1199px) {
  .promo-terms-popup { width: 840px; height: 520px; border-radius: 11px; }
  .promo-terms-container { width: 840px; height: 520px; }
  .promo-terms-banner { width: 625px; }
  .promo-terms-box { width: 440px !important; }
  .promo-terms-overlay { width: 440px; padding: 16px; }
  .promo-terms-content { transform: translateY(-47px); }
}

@media (max-width: 767px) {
  .promo-terms-popup { width: 630px; height: 415px; border-radius: 8px; }
  .promo-terms-container { width: 630px; height: 415px; }
  .promo-terms-banner { width: 420px; }
  .promo-terms-box { width: 350px !important; }
  .promo-terms-overlay { width: 350px; padding: 13px; }
  .promo-terms-content { transform: translateY(-36px); }
}

@media (min-width: 480px) and (max-width: 767px) {
  .promo-terms-popup { width: 567px; height: 374px; border-radius: 7px; }
  .promo-terms-container { width: 567px; height: 374px; }
  .promo-terms-banner { width: 378px; }
  .promo-banner-title { font-size: 20px; }
  .promo-terms-box { width: 315px !important; }
  .promo-terms-overlay { width: 315px; padding: 12px; }
  .promo-terms-content { transform: translateY(-32px); }
  .promo-terms-close { bottom: -5px; }
}

@media (min-width: 480px) and (max-width: 767px) {
  .promo-terms-popup { width: 567px; height: 374px; border-radius: 7px; }
  .promo-terms-container { width: 567px; height: 374px; }
  .promo-terms-banner { width: 378px; }
  .promo-banner-title { font-size: 20px; }
  .promo-terms-box { width: 315px !important; }
  .promo-terms-overlay { width: 315px; padding: 12px; }
  .promo-terms-content { transform: translateY(-32px); }
  .promo-terms-close { bottom: -5px; }
  .promo-image-top { transform: translateY(-30px); }
  .promo-image-bottom { transform: translateY(-80px); }
  .promo-image-message { top: 239px; }
  .promo-win-value { top: 257px; }
  .promo-prizes-list { top: 249px; }
  .promo-qualifying-bet { top: 376px; }
  .promo-end-date { top: 388px; }
  .promo-terms-link { top: 400px; }
  .promo-actions { bottom: 17px; }
}

@media (max-width: 479px) {
  .promo-terms-popup { width: 420px; height: 491px; border-radius: 6px; }
  .promo-terms-container { width: 420px; height: 491px; }
  .promo-terms-banner { width: 395px; }
  .promo-banner-title { font-size: 16px; }
  .promo-terms-box { width: 280px !important; }
  .promo-terms-overlay { width: 280px; padding: 11px; }
  .promo-terms-content { transform: translateY(-33px); }
  .promo-terms-tab img { width: 65%; }
  .promo-terms-close { bottom: -9px; }
}
</style>
