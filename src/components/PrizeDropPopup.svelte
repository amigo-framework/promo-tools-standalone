<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { IConnector, Campaign } from '../interfaces/IPromoTool';
  import prizeDropImage from '../assets/promo/prizedrop.png';
  import btnGreenNormal from '../assets/buttons/btn_green_normal.png';
  import btnGreenHover from '../assets/buttons/btn_green_hover.png';
  import btnGreenDown from '../assets/buttons/btn_green_down.png';
  import btnRedNormal from '../assets/buttons/btn_red_normal.png';
  import btnRedHover from '../assets/buttons/btn_red_hover.png';
  import btnRedDown from '../assets/buttons/btn_red_down.png';

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
  let primaryButtonState: 'normal' | 'hover' | 'down' = 'normal';
  let secondaryButtonState: 'normal' | 'hover' | 'down' = 'normal';

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
  $: prizesToShow = getPrizesToShow(effectiveConfig, effectiveCampaignState);
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
    if (!currentConfig?.prizes?.length) return [];
    return currentConfig.prizes
      .map((prize: any, index: number) => ({
        ...prize,
        prizeIndex: index,
        amountLeft: Number(currentCampaignState?.amountsLeft?.[index] ?? prize.amount ?? 0),
      }))
      .filter((detailedPrize: any) => detailedPrize.amountLeft > 0);
  }

  function getPrizesNotShownLeft(visiblePrizes: any[], currentCampaignState: any): number {
    if (!currentCampaignState?.amountsLeft?.length) return 0;
    const totalLeft = currentCampaignState.amountsLeft.reduce((sum: number, amountLeft: number) => sum + amountLeft, 0);
    const shownLeft = visiblePrizes.reduce((sum: number, detailedPrize: any) => sum + (detailedPrize.amountLeft || 0), 0);
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
    const prizes = currentConfig?.prizes || [];
    if (!prizes.length) return '0x:$0.00';

    const amountsLeft = currentCampaignState?.amountsLeft || [];
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

  function openRulesPopup() {
    const rulesPrizeLines = (effectiveConfig?.prizes || []).map((prize: any, index: number) => {
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

    const message = [
      tr('prizeDropRulesPrizesMessage'),
      ...rulesPrizeLines,
      qualifyingLine,
      endDateLine,
      '',
      tr('prizeDropRulesOtherMessage'),
    ].filter(Boolean).join('\n');

    connector.ui().showPopup({
      title: tr('prizeDropRulesTitle'),
      message,
      buttons: [{
        label: tr('prizeDropRulesCloseButton'),
        secondary: true,
        callback: () => {},
      }],
    });
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

{#if !loading && visible}
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
      <img class="promo-image-base" src={prizeDropImage} alt="" aria-hidden="true" />
      <div class="promo-image-overlay-content">
        <h3 id="popup-title" class="promo-title">{title}</h3>
        <div class="promo-image-message">{message}</div>

        {#if mode === 'prizeWon'}
          <div class="promo-win-value">{getPrizeWonValue()}</div>
        {/if}

        {#if mode === 'finished'}
          <div class="promo-win-value">{finishedTotalWonValue}</div>
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
            {#each prizesToShow as prize, index}
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
          <button type="button" class="promo-terms-link" on:click|stopPropagation={openRulesPopup}>
            {tr('prizeDropStartedTermsAndConditionsMessage')}
          </button>
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
.promo-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:var(--overlay-background);display:flex;align-items:center;justify-content:center;z-index:999999 !important;pointer-events:auto !important}
.promo-image-popup{position:relative;width:min(92vw,700px);border-radius:10px;overflow:hidden;box-shadow:0 8px 22px rgba(0,0,0,.35);font-family:Helvetica,Arial,sans-serif;background:transparent;pointer-events:auto}
.promo-image-base{display:block;width:100%;height:auto;max-height:85vh;object-fit:contain}
.promo-image-overlay-content{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.35));padding:20px;color:#fff;pointer-events:none}
.promo-title{position:absolute;left:50%;top:43%;width:calc(100% - 40px);margin:0;transform:translateX(-50%);text-align:center;font-size:28px;line-height:1.05;text-shadow:0 2px 4px rgba(0,0,0,.6)}
.promo-image-message{position:absolute;left:50%;top:53%;width:calc(100% - 40px);transform:translateX(-50%);text-align:center;font-weight:600;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.promo-win-value{position:absolute;left:50%;top:58%;width:calc(100% - 40px);transform:translateX(-50%);text-align:center;font-size:26px;font-weight:800;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.7)}
.promo-qualifying-bet{position:absolute;left:50%;top:64%;width:calc(100% - 40px);transform:translateX(-50%);text-align:center;font-size:13px;text-shadow:0 1px 2px rgba(0,0,0,.7)}
.promo-prizes-list{position:absolute;left:50%;top:58%;width:calc(100% - 40px);max-width:400px;transform:translateX(-50%);background:rgba(0,0,0,.15);border-radius:8px;padding:12px;backdrop-filter:blur(4px)}
.promo-prize-item{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px;line-height:1.3}
.promo-prize-item:last-child{margin-bottom:0}
.promo-prize-left{color:#fff;flex:1;text-align:left}
.promo-prize-value{color:#fff;font-weight:700;text-align:right;margin-left:8px}
.promo-prize-more{justify-content:center;font-style:italic;color:#ddd}
.promo-end-date{position:absolute;left:50%;top:70%;width:calc(100% - 40px);transform:translateX(-50%);text-align:center;font-size:14px;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.promo-terms-link{position:absolute;left:50%;top:75%;transform:translateX(-50%);background:transparent;border:0;color:#fff;text-decoration:underline dotted;cursor:pointer;font-size:13px;font-weight:600}
.promo-terms-link{position:absolute;left:50%;top:75%;transform:translateX(-50%);background:transparent;border:0;color:#fff;text-decoration:underline dotted;cursor:pointer;font-size:13px;font-weight:600;pointer-events:auto}
.promo-actions{position:absolute;left:50%;right:auto;bottom:58px;display:flex;justify-content:center;gap:8px;padding:0 14px;transform:translateX(-50%);pointer-events:auto}
.promo-image-button{position:relative;border:0;background:transparent;padding:0;cursor:pointer;min-width:120px}
.promo-image-button-bg{display:block;width:120px;height:auto;user-select:none;pointer-events:none}
.promo-image-button-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;text-shadow:0 1px 2px rgba(0,0,0,.5)}
@media (max-width: 768px){.promo-image-popup{width:95vw}.promo-image-base{max-height:88vh}.promo-image-overlay-content{inset:0;padding:14px}.promo-title{top:22%;width:calc(100% - 24px);font-size:22px}.promo-image-message{top:51%;width:calc(100% - 24px)}.promo-win-value{top:50%;width:calc(100% - 24px);font-size:22px}.promo-qualifying-bet{top:64%;width:calc(100% - 24px);font-size:12px}.promo-prizes-list{top:58%;width:calc(100% - 24px);padding:10px;font-size:12px}.promo-end-date{top:70%;width:calc(100% - 24px);font-size:12px}.promo-terms-link{top:73%;font-size:12px}.promo-actions{gap:8px;bottom:58px}.promo-image-button,.promo-image-button-bg{width:120px;min-width:120px}.promo-image-button-label{font-size:12px}}
</style>
