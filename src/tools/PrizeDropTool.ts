import type { IPromoTool, IConnector, Campaign } from '@/interfaces/IPromoTool';
import { SvelteOverlayManager } from '@/shared/SvelteComponents';

const EmptyHeaderIcon = () => null;

export class PrizeDropTool implements IPromoTool {
  private activeCampaignId: string | null = null;
  private activeCampaignInfo: {left: number; total: number} | null = null;
  private overlayManager: SvelteOverlayManager;

  constructor() {
    this.overlayManager = new SvelteOverlayManager();
  }

  async init(connector: IConnector, campaign: Campaign): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}> {
    await this.overlayManager.init();
    const {config, campaignState, playerState} = await connector.getCampaign(campaign.campaignId, true);

    if (campaign.status === "started") {
      return new Promise(resolve => {
        this.showStartedCampaignPopup(connector, campaign, config, campaignState, playerState, resolve);
      });
    } else if (campaign.status === "finished") {
      this.updateActiveCampaignHeader(connector, campaign, config, campaignState, playerState);
      await new Promise(resolve => this.showFinishedCampaignPopup(connector, campaign, resolve));
      return {shouldIgnore: false, shouldRefresh: true};
    } else if (campaign.status === "active") {
      this.updateActiveCampaignHeader(connector, campaign, config, campaignState, playerState);
      this.activeCampaignId = campaign.campaignId;
      return new Promise(resolve => {
        this.showActiveCampaignPopup(connector, campaign, config, campaignState, playerState, resolve);
      });
    }

    return {shouldIgnore: false, shouldRefresh: false};
  }

  async onExpired(connector: IConnector, campaign: Campaign): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}> {
    const {config, campaignState, playerState} = await connector.getCampaign(campaign.campaignId);
    this.updateActiveCampaignHeader(connector, campaign, config, campaignState, playerState);
    await new Promise(resolve => this.showFinishedCampaignPopup(connector, campaign, resolve));
    return {shouldIgnore: false, shouldRefresh: true};
  }

  async onWager(): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}> {
    return {shouldIgnore: false, shouldRefresh: false};
  }

  async onStopped(connector: IConnector, campaign: Campaign, {roundId}: any): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}> {
    const {config, campaignState, playerState} = await connector.getCampaign(campaign.campaignId);

    if (campaign.status === "started") {
      return new Promise(resolve => {
        this.showStartedCampaignPopup(connector, campaign, config, campaignState, playerState, resolve);
      });
    }

    if (campaign.status === "active" || campaign.status === "finished") {
      this.updateActiveCampaignHeader(connector, campaign, config, campaignState, playerState);
      const lastPrizeWon = playerState?.prizesWon[playerState.prizesWon.length - 1];
      if (lastPrizeWon && roundId === lastPrizeWon.roundId) {
        await new Promise(resolve => this.showPrizeWonPopup(connector, campaign, lastPrizeWon, resolve));
      }
    }

    const totalAmountLeft = Array.isArray(campaignState?.amountsLeft)
      ? campaignState.amountsLeft.reduce((sum: number, amount: number) => sum + Number(amount || 0), 0)
      : 0;

    const shouldShowFinishedPopup = campaign.status === "finished" || totalAmountLeft <= 0;

    if (shouldShowFinishedPopup) {
      const finishedCampaign = campaign.status === 'finished'
        ? campaign
        : ({ ...campaign, status: 'finished' } as Campaign);

      await new Promise(resolve => this.showFinishedCampaignPopup(connector, finishedCampaign, resolve));
      return {shouldIgnore: false, shouldRefresh: true};
    }

    return {shouldIgnore: false, shouldRefresh: false};
  }

  async onBetChanged(connector: IConnector, campaign: Campaign): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}> {
    if (campaign.status !== "planned") {
      const {config, campaignState, playerState} = await connector.getCampaign(campaign.campaignId);
      this.updateActiveCampaignHeader(connector, campaign, config, campaignState, playerState);
    }
    return {shouldIgnore: false, shouldRefresh: false};
  }

  getActiveCampaignId(): string | null {
    return this.activeCampaignId;
  }

  getActiveCampaignInfo() {
    return this.activeCampaignInfo;
  }

  destroy(): void {
    this.overlayManager.destroy();
  }

  private async showStartedCampaignPopup(connector: IConnector, campaign: Campaign, config: any, campaignState: any, playerState: any, resolve: (value: any) => void) {
    const result = await this.overlayManager.showPrizeDropPopup(connector, campaign, 'started');

    if (result.action === 'buttonClick') {
      this.updateActiveCampaignHeader(connector, campaign, config, campaignState, playerState);
      this.activeCampaignId = campaign.campaignId;
      resolve({shouldIgnore: false, shouldRefresh: false});
    } else {
      resolve({shouldIgnore: true, shouldRefresh: false});
    }
  }

  private async showActiveCampaignPopup(_connector: IConnector, campaign: Campaign, _config: any, _campaignState: any, _playerState: any, resolve: (value: any) => void) {
    await this.overlayManager.showPrizeDropPopup(_connector, campaign, 'active');
    resolve({shouldIgnore: false, shouldRefresh: false});
  }

  private async showPrizeWonPopup(_connector: IConnector, campaign: Campaign, prizeWon: any, resolve: (value: any) => void) {
    await this.overlayManager.showPrizeDropPopup(_connector, campaign, 'prizeWon', prizeWon);
    resolve(undefined);
  }

  private async showFinishedCampaignPopup(_connector: IConnector, campaign: Campaign, resolve: (value: any) => void) {
    let acknowledged = false;
    try {
      const result = await this.overlayManager.showPrizeDropPopup(
        _connector,
        campaign,
        'finished'
      );

      console.log('[PrizeDropTool] finished popup result:', result);

      if (result.action === 'buttonClick' || result.action === 'close') {
        await _connector.acknowledgeCampaign(campaign.campaignId);
        _connector.ui().removePromoHeader('prizeDrop');
        this.activeCampaignId = null;
        acknowledged = true;
        console.log('[PrizeDropTool] campaign acknowledged:', campaign.campaignId);
      }
    } catch (error) {
      console.error('[PrizeDropTool] finished popup flow error:', error);
    } finally {
      if (!acknowledged) {
        try {
          await _connector.acknowledgeCampaign(campaign.campaignId);
          _connector.ui().removePromoHeader('prizeDrop');
          this.activeCampaignId = null;
          console.log('[PrizeDropTool] campaign acknowledged by fallback:', campaign.campaignId);
        } catch (fallbackError) {
          console.error('[PrizeDropTool] fallback acknowledge failed:', campaign.campaignId, fallbackError);
        }
      }
    }

    resolve(undefined);
  }

  private updateActiveCampaignHeader(connector: IConnector, _campaign: Campaign, _config: any, campaignState: any, _playerState: any) {
    const prizesLeft = campaignState.amountsLeft.reduce((sum: number, amount: number) => sum + amount, 0);
    const totalPrizes = campaignState.amountsLeft.length;
    this.activeCampaignInfo = { left: prizesLeft, total: totalPrizes };

    if (connector.ui && typeof connector.ui === 'function') {
      const ui = connector.ui();
      if (ui.addPromoHeader) {
        ui.addPromoHeader('prizeDrop', EmptyHeaderIcon, `${prizesLeft}/${totalPrizes}`, 'Prizes Left');
      }
    }
  }
}
