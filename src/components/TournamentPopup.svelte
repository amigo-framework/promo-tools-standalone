<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { IConnector, Campaign } from '../interfaces/IPromoTool';
  import promoTopTournament from '../assets/promo/promo_top_tournament.png';
  import promoBottom from '../assets/promo/promo_bottom.png';
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
  export let mode: 'started' | 'active' | 'finished' = 'started';
  export let initialData: {config: any; campaignState: any; playerState: any} | null = null;

  const dispatch = createEventDispatcher();
  const TOURNAMENT_DEBUG_VERSION = 'TOURNAMENT_DEBUG_2026-02-17T14:45Z';
  console.log('[TournamentPopup] debug version loaded:', TOURNAMENT_DEBUG_VERSION);
  let visible = false;
  let loading = true;
  let config: any = null;
  let campaignState: any = null;
  let playerState: any = null;
  let showTermsAndConditions = false;
  let termsActiveTab = 'terms'; // 'terms' or 'conditions'

  onMount(async () => {
    try {
      console.log('[TournamentPopup] onMount debug version:', TOURNAMENT_DEBUG_VERSION);
      console.log('[TournamentPopup] campaign prop received:', campaign);
      if (initialData?.config || initialData?.campaignState || initialData?.playerState) {
        console.log('[TournamentPopup] using initialData payload:', initialData);
        config = initialData.config;
        campaignState = initialData.campaignState;
        playerState = initialData.playerState;
      } else {
        const data = await connector.getCampaign(campaign.campaignId, true);
        console.log('[TournamentPopup] getCampaign payload received:', data);
        config = data.config;
        campaignState = data.campaignState;
        playerState = data.playerState;
      }
      console.log('[TournamentPopup] state assigned:', {
        config,
        campaignState,
        playerState,
      });
    } finally {
      loading = false;
      visible = true;
    }
  });

  $: title = getTitle(mode);
  $: message = getMessage(mode, campaignState, playerState);
  $: playerPosition = getPlayerPosition(campaignState, playerState);
  $: wonPrizeValue = getWonPrizeValue(mode, config, campaignState, playerState);
  $: topPrizeValue = getTopPrizeSummary(config, playerState);
  $: prizesToShow = (config?.prizes || []).slice(0, 3);
  $: prizesNotShownLeft = Math.max((config?.prizes?.length || 0) - prizesToShow.length, 0);
  $: minimalQualifyingBet = findMinimalQualifyingBet(connector.bets, playerState);
  $: primaryButtonLabel = mode === 'finished' ? tr('tournamentFinishedAcknowledgeButton') : tr('start');
  $: secondaryButtonLabel = connector.settings?.closePromoOptOut === 'true' ? tr('close') : tr('optOut');
  $: showOptOutButton = mode === 'started' && connector.settings?.hidePromoOptOut !== 'true';
  $: console.log('[TournamentPopup] computed summary values:', {
    debugVersion: TOURNAMENT_DEBUG_VERSION,
    mode,
    playerPosition,
    topPrizeValue,
    wonPrizeValue,
    prizes: config?.prizes,
    exchangedCashValues: playerState?.exchangedCashValues,
    campaignExchangedCashValues: campaignState?.exchangedCashValues,
    leaderboard: campaignState?.leaderboard,
  });
  $: if (mode !== 'finished') {
    console.log('[TournamentPopup] rendered top value (started/active):', {
      debugVersion: TOURNAMENT_DEBUG_VERSION,
      topPrizeValue,
      rawPlayerExchanged: playerState?.exchangedCashValues,
      rawCampaignExchanged: campaignState?.exchangedCashValues,
      rawPrizes: config?.prizes,
    });
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

  function getTitle(currentMode: 'started' | 'active' | 'finished'): string {
    return currentMode === 'finished' ? tr('tournamentFinishedTitle') : tr('tournamentStartedTitle');
  }

  function getPlayerPosition(currentCampaignState: any, currentPlayerState: any): number {
    const roundIds = currentCampaignState?.leaderboard?.roundIds || [];
    const playerRoundId = currentPlayerState?.leaderboardRoundId;
    if (playerRoundId != null) {
      let index = roundIds.findIndex((roundId: string) => roundId === playerRoundId);
      if (index < 0) {
        index = roundIds.findIndex((roundId: string) => String(roundId) === String(playerRoundId));
      }
      if (index >= 0) {
        return index + 1;
      }
    }

    const directRankCandidates = [
      currentPlayerState?.rank,
      currentPlayerState?.position,
      currentPlayerState?.leaderboardPosition,
      currentPlayerState?.leaderboardRank,
    ];
    for (const candidate of directRankCandidates) {
      const numeric = Number(candidate);
      if (Number.isFinite(numeric) && numeric > 0) {
        return numeric;
      }
    }

    return -1;
  }

  function getPrizeIndex(prizes: any[], positionIndex: number): number {
    if (!Array.isArray(prizes) || prizes.length === 0 || positionIndex < 0) return -1;

    // React-equivalent prize bucket lookup
    let index = 0;
    let prizesSum = prizes[0].amount;
    while (index < prizes.length && positionIndex >= prizesSum) {
      index += 1;
      if (index < prizes.length) {
        prizesSum += prizes[index].amount;
      }
    }

    return index;
  }

  function getPrizeUnitValue(prize: any, prizeIndex: number): string {
    if (!prize) return '';
    const parseNumeric = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const numericPart = value.replace(/[^0-9,.-]/g, '');
        const normalized = numericPart.replace(',', '.');
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : NaN;
      }
      return Number(value);
    };

    const startedModeCandidates = [
      prize?.value,
      prize?.cashValue,
      playerState?.exchangedCashValues?.[prizeIndex],
      campaignState?.exchangedCashValues?.[prizeIndex],
      prize?.exchangedCashValue,
      playerState?.exchangedCashValues?.[0],
      campaignState?.exchangedCashValues?.[0],
    ];

    const finishedModeCandidates = [
      playerState?.exchangedCashValues?.[prizeIndex],
      campaignState?.exchangedCashValues?.[prizeIndex],
      prize?.exchangedCashValue,
      prize?.cashValue,
      prize?.value,
      playerState?.exchangedCashValues?.[0],
      campaignState?.exchangedCashValues?.[0],
    ];

    const exchangedCandidates = (mode === 'finished' ? finishedModeCandidates : startedModeCandidates)
      .map((candidate) => parseNumeric(candidate));

    const firstPositive = exchangedCandidates.find((value) => Number.isFinite(value) && value > 0);
    const firstFinite = exchangedCandidates.find((value) => Number.isFinite(value));
    const globalPositive = [
      ...(Array.isArray(playerState?.exchangedCashValues) ? playerState.exchangedCashValues : []),
      ...(Array.isArray(campaignState?.exchangedCashValues) ? campaignState.exchangedCashValues : []),
    ]
      .map((candidate) => parseNumeric(candidate))
      .find((value) => Number.isFinite(value) && value > 0);

    const exchanged = firstPositive ?? globalPositive ?? firstFinite;
    const prizeType = String(prize?.type ?? '').toLowerCase();

    if (exchanged != null) {
      return safeFormatCurrency(exchanged as number);
    }
    if (prizeType === 'cash') {
      return safeFormatCurrency(Number(prize?.value ?? 0));
    }
    if (prizeType === 'multiplier') {
      return `${prize?.value ?? 0}x ${tr('bet').toLowerCase()}`;
    }
    return safeFormatCurrency(0);
  }

  function getPrizeSummary(prize: any, prizeIndex: number): string {
    if (!prize) return '';
    const parsedAmount = Number(prize?.amount ?? prize?.totalAmount ?? 1);
    const amount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 1;
    const unitValue = getPrizeUnitValue(prize, prizeIndex);
    if (!unitValue) return '';
    const amountLabel = tr('tournamentStartedPrizesMessage', { totalAmount: amount });
    const normalizedAmountLabel = amountLabel && amountLabel !== 'tournamentStartedPrizesMessage'
      ? amountLabel
      : `${amount}x`;
    const summary = `${normalizedAmountLabel} ${unitValue}`;
    console.log('[TournamentPopup] prize summary computed:', {
      prizeIndex,
      prize,
      amount,
      unitValue,
      summary,
    });
    return summary;
  }

  function getWonPrizeValue(currentMode: 'started' | 'active' | 'finished', currentConfig: any, currentCampaignState: any, currentPlayerState: any): string {
    if (currentMode !== 'finished') return '';
    const position = getPlayerPosition(currentCampaignState, currentPlayerState);

    const prizes = currentConfig?.prizes || [];
    let prizeIndex = position > 0 ? getPrizeIndex(prizes, position - 1) : -1;
    if (prizeIndex < 0 && Array.isArray(currentPlayerState?.exchangedCashValues)) {
      prizeIndex = currentPlayerState.exchangedCashValues.findIndex((v: any) => Number(v) > 0);
    }
    if (prizeIndex < 0) {
      prizeIndex = 0;
    }

    const prize = prizes[prizeIndex];
    const exchangedPrizeValue = currentPlayerState?.exchangedCashValues?.[prizeIndex];
    const prizeType = String(prize?.type ?? '').toLowerCase();

    if (prizeType === 'cash') {
      const numericExchanged = Number(exchangedPrizeValue);
      if (Number.isFinite(numericExchanged)) {
        return connector.formatCurrency(numericExchanged);
      }

      const firstPositiveExchanged = (currentPlayerState?.exchangedCashValues || [])
        .map((v: any) => Number(v))
        .find((v: number) => Number.isFinite(v) && v > 0);
      if (firstPositiveExchanged != null) {
        return connector.formatCurrency(firstPositiveExchanged);
      }

      const fallbackPrizeValue = Number(prize?.value);
      if (Number.isFinite(fallbackPrizeValue)) {
        return connector.formatCurrency(fallbackPrizeValue);
      }

      return '';
    }

    if (prize?.value != null && String(prize.value).length > 0) {
      return String(prize.value);
    }

    return '';
  }

  function getTopPrizeSummary(currentConfig: any, currentPlayerState: any): string {
    const prizeList = Array.isArray(currentConfig?.prizes) ? currentConfig.prizes : [];
    const topPrizeIndex = 0;
    const prize = prizeList[topPrizeIndex];
    if (!prize) return '';

    const amount = Number(prize?.amount ?? 1);
    const count = Number.isFinite(amount) && amount > 0 ? amount : 1;

    // React-equivalent source for started/active tournament display:
    // prize.type === "cash" ? connector.formatCurrency(playerState.exchangedCashValues[index]) : prize.value
    const unitValue = String(prize?.type ?? '').toLowerCase() === 'cash'
      ? connector.formatCurrency(currentPlayerState?.exchangedCashValues?.[topPrizeIndex] ?? 0)
      : String(prize?.value ?? '');

    const amountLabel = tr('tournamentStartedPrizesMessage', { totalAmount: count });
    const normalizedAmountLabel = amountLabel && amountLabel !== 'tournamentStartedPrizesMessage'
      ? amountLabel
      : `${count}x`;

    const summary = `${normalizedAmountLabel} ${unitValue}`;
    console.log('[TournamentPopup] top prize summary (react-aligned) computed:', {
      debugVersion: TOURNAMENT_DEBUG_VERSION,
      topPrizeIndex,
      prize,
      exchangedAtIndex: currentPlayerState?.exchangedCashValues?.[topPrizeIndex],
      summary,
      rawPlayerExchanged: currentPlayerState?.exchangedCashValues,
      rawCampaignExchanged: campaignState?.exchangedCashValues,
    });
    return summary;
  }

  function getStartedPrizeValue(prize: any, index: number): string {
    const raw = playerState?.exchangedCashValues?.[index];

    if (String(prize?.type ?? '').toLowerCase() === 'cash') {
      if (typeof raw === 'string') {
        const numeric = Number(raw.replace(/[^0-9,.-]/g, '').replace(',', '.'));
        if (Number.isFinite(numeric)) {
          return connector.formatCurrency(numeric);
        }
        if (raw.trim().length > 0) {
          return raw;
        }
      }

      if (typeof raw === 'number') {
        return connector.formatCurrency(raw);
      }

      const fallbackNumeric = Number(prize?.value ?? 0);
      return connector.formatCurrency(Number.isFinite(fallbackNumeric) ? fallbackNumeric : 0);
    }

    return String(prize?.value ?? '');
  }

  function getMessage(currentMode: 'started' | 'active' | 'finished', currentCampaignState: any, currentPlayerState: any): string {
    if (currentMode !== 'finished') return tr('tournamentStartedMessage');

    const position = getPlayerPosition(currentCampaignState, currentPlayerState);
    if (position > 0) {
      return `${tr('tournamentFinishedIntroMessage')} ${tr('tournamentFinishedPositionMessage', { position })}`;
    }

    return `${tr('tournamentFinishedIntroMessage')} ${tr('tournamentFinishedOutroMessage')}`;
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

  async function handleOptOut() {
    if (connector.settings?.closePromoOptOut !== 'true') {
      await connector.optCampaign(campaign.campaignId, false);
      visible = false;
      dispatch('buttonClick', { action: 'optOut' });
      return;
    }

    visible = false;
    setTimeout(() => dispatch('close'), 200);
  }

  async function handleStart() {
    if (mode === 'active') {
      visible = false;
      setTimeout(() => dispatch('close'), 0);
      return;
    }

    if (mode === 'started') {
      await connector.optCampaign(campaign.campaignId, true);
      visible = false;
      dispatch('buttonClick', { action: 'start' });
      return;
    }

    visible = false;
    dispatch('buttonClick');
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
    const prizes = config?.prizes || [];
    const lines: string[] = [tr('tournamentRulesPrizesIntroMessage')];

    let startPlace = 1;
    for (let i = 0; i < prizes.length; i += 1) {
      const prize = prizes[i];
      if (!prize?.value) continue;
      const amount = Number(prize.amount || 0);
      const value = prize.type === 'cash'
        ? safeFormatCurrency(playerState?.exchangedCashValues?.[i] ?? prize.value ?? 0)
        : String(prize.value);

      if (amount === 1) {
        lines.push(`${tr('tournamentRulesPositionMessage', { position: startPlace })} ${value}`);
      } else {
        lines.push(`${tr('tournamentRulesPositionsMessage', { from: startPlace, to: startPlace + amount - 1 })} ${value}`);
      }
      startPlace += amount;
    }

    if (minimalQualifyingBet != null) {
      lines.push(`${tr('tournamentRulesQualifyingBetMessage')}${safeFormatCurrency(minimalQualifyingBet)}`);
    }
    if (campaign.end) {
      lines.push(`${tr('tournamentStartedEndDateMessage')}${new Date(campaign.end).toLocaleString()}`);
    }
    lines.push('');
    lines.push(tr('tournamentRulesOtherMessage'));

    return lines.join('\n');
  }

  export function closePopup() {
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
    transition:fade={{ duration: 200 }}
  >
    <section
      class="promo-image-popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <div class="promo-image-container">
        <img class="promo-image-top" src={promoTopTournament} alt="" aria-hidden="true" />
        <img class="promo-image-bottom" src={promoBottom} alt="" aria-hidden="true" />
      </div>
      <div class="promo-image-overlay-content">
        <div id="popup-title" class="promo-title">{title}</div>
        {#if mode === 'finished'}
          <div class="promo-finished-message">
            {tr('tournamentFinishedIntroMessage')} <br>
            {#if playerPosition > 0}
              {tr('tournamentFinishedPositionMessage', { position: playerPosition })} <br>
              {#if wonPrizeValue}
                {tr('tournamentFinishedPrizeMessage')} <b>{wonPrizeValue}</b>!<br><br>
              {/if}
              {tr('tournamentFinishedCongratulationsMessage')}
            {:else}
              {#if wonPrizeValue}
                {tr('tournamentFinishedPrizeMessage')} <b>{wonPrizeValue}</b>!<br><br>
              {/if}
              {tr('tournamentFinishedOutroMessage')}
            {/if}
          </div>
        {:else}
          <div class="promo-image-message">{message}</div>
          <div class="promo-win-value promo-win-list">
            <ul class="promo-win-list-ul">
              {#each prizesToShow as prize, index}
                {#if prize?.value !== undefined && prize?.value !== null}
                  <li>
                    {tr('tournamentStartedPrizesMessage', { totalAmount: prize.amount })} 
                    <span>{getStartedPrizeValue(prize, index)}</span>
                  </li>
                {/if}
              {/each}
              {#if prizesNotShownLeft > 0}
                <li><i>{tr('tournamentStartedAndMoreMessage')}</i></li>
              {/if}
            </ul>
          </div>
        {/if}

        {#if mode !== 'finished' && minimalQualifyingBet != null}
          <div class="promo-qualifying-bet">
            {tr('tournamentStartedQualifyingBetMessage')}<b>{safeFormatCurrency(minimalQualifyingBet)}</b>
          </div>
        {/if}

        {#if campaign.end && mode !== 'finished'}
          <div class="promo-end-date">
            {tr('tournamentStartedEndDateMessage')}<b>{new Date(campaign.end).toLocaleString()}</b>
          </div>
        {/if}

        {#if mode !== 'finished'}
          <button type="button" class="promo-terms-link" on:click|stopPropagation={openTermsAndConditions}>
            {tr('tournamentStartedTermsAndConditionsMessage')}
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
                  <h3>Tournament Rules</h3>
                  <div class="terms-content">
                    {@html getTermsContent().replace(/\n/g, '<br>')}
                  </div>
                </div>
              {:else}
                <div class="promo-terms-content-text">
                  <h3>Terms and Conditions</h3>
                  <p><strong>Tournament Conditions:</strong></p>
                  <ul>
                    <li>This tournament is available to eligible players only</li>
                    <li>Rankings are updated in real-time during the tournament</li>
                    <li>Final rankings determine prize distribution</li>
                    <li>Standard terms and conditions apply</li>
                  </ul>
                  
                  <p><strong>Prize Conditions:</strong></p>
                  <ul>
                    <li>Prizes are awarded based on final tournament position</li>
                    <li>Cash prizes are credited directly after tournament ends</li>
                    <li>Tournament results are final and binding</li>
                  </ul>
                  
                  {#if campaign.end}
                    <p><strong>Tournament ends:</strong> {new Date(campaign.end).toLocaleString()}</p>
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
.promo-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:var(--overlay-background);display:flex;align-items:center;justify-content:center;z-index:999999 !important;pointer-events:auto !important}
.promo-image-popup{position:relative;width:400px;height:470px;border-radius:10px;overflow:hidden;box-shadow:0 8px 22px rgba(0,0,0,.35);font-family:Helvetica,Arial,sans-serif;background:transparent;pointer-events:auto;transform-origin:center center}
.promo-image-container{position:relative;width:400px;height:470px;display:flex;flex-direction:column;transform:translateY(-10px)}
.promo-image-top{display:block;width:400px;height:auto;object-fit:contain;flex-shrink:0;aspect-ratio:925/695}
.promo-image-bottom{display:block;width:400px;height:auto;object-fit:contain;flex-shrink:0;aspect-ratio:925/352}
.promo-image-overlay-content{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.35));padding:20px;color:#fff;pointer-events:none}
.promo-title{position:absolute;left:50%;top:225px;width:360px;margin:0;transform:translateX(-50%);text-align:center;font-family:'Roboto-Bold',sans-serif;font-size:20px;font-weight:bolder;line-height:1.05;color:#ffff00;-webkit-text-stroke:0.5px #000000}
.promo-image-message{position:absolute;left:50%;top:269px;width:360px;transform:translateX(-50%);text-align:center;font-weight:600;font-size:12px;color:#ffff00;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.promo-finished-message{position:absolute;left:50%;top:261px;width:360px;transform:translateX(-50%);text-align:center;font-weight:600;font-size:12px;text-shadow:0 1px 2px rgba(0,0,0,.6);margin-top:5px}
.promo-win-value{position:absolute;left:50%;top:287px;width:360px;transform:translateX(-50%);text-align:center;font-size:16px;color:#ffffff;-webkit-text-stroke:0.5px #ee141a}
.prize-text-small{position:relative;font-family:'Roboto-Bold',sans-serif;font-weight:bolder;display:inline-block;color:#ffffff;-webkit-text-stroke:0.5px #ee141a}
.promo-win-list{top:288px;left:50%;width:max-content;max-width:320px;transform:translateX(-50%);text-align:center;font-size:12px}
.promo-win-list-ul{margin:0;padding-left:0;list-style:none}
.promo-qualifying-bet{position:absolute;left:50%;top:385px;width:360px;transform:translateX(-50%);text-align:center;font-size:7px;text-shadow:0 1px 2px rgba(0,0,0,.7)}
.promo-end-date{position:absolute;left:50%;top:397px;width:360px;transform:translateX(-50%);text-align:center;font-size:7px;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.promo-terms-link{position:absolute;left:50%;top:409px;transform:translateX(-50%);background:transparent;border:0;color:#fff;text-decoration:underline dotted;cursor:pointer;font-size:7px;font-weight:600;pointer-events:auto}
.promo-actions{position:absolute;left:50%;right:auto;bottom:11px;display:flex;justify-content:center;gap:4px;padding:0 7px;transform:translateX(-50%);pointer-events:auto}
.promo-image-button{position:relative;border:0;background:transparent;padding:0;cursor:pointer;min-width:60px;pointer-events:auto;width:60px;height:auto}
.promo-image-button img{display:block;width:60px;height:auto;user-select:none;pointer-events:none}
.promo-image-button img.hover{display:none}
.promo-image-button img.down{display:none}
.promo-image-button:hover img.normal{display:none}
.promo-image-button:hover img.hover{display:block}
.promo-image-button:active img.normal,
.promo-image-button:active img.hover{display:none}
.promo-image-button:active img.down{display:block}
.promo-image-button-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Roboto',Arial,sans-serif;font-size:9px;font-weight:900;letter-spacing:.2px;text-transform:uppercase;color:#000000 !important;pointer-events:none}
.promo-image-button.secondary .promo-image-button-label{color:#000000 !important}
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
.promo-terms-tab{position:relative;border:none;background:transparent;padding:0;cursor:pointer;transition:all 0.2s;margin:0 auto;pointer-events:auto}
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
.promo-terms-close{position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);background:transparent;border:none;cursor:pointer;transition:all 0.2s;flex-shrink:0;padding:0}
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
  .promo-terms-close { bottom: -10px; }
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
