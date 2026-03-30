import type { IPromoTool, IConnector, Campaign } from '@/interfaces/IPromoTool';
import { SvelteOverlayManager } from '@/shared/SvelteComponents';

export class FreeBetsTool implements IPromoTool {
  private activeCampaignId: string | null = null;
  private activeCampaignInfo: {used: number; total: number} | null = null;
  private overlayManager: SvelteOverlayManager;

  constructor() {
    this.overlayManager = new SvelteOverlayManager();
  }

  async init(connector: IConnector, campaign: Campaign): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}> {
    await this.overlayManager.init();
    const {config, playerState} = await connector.getCampaign(campaign.campaignId, true);

    if (campaign.status === "started") {
      return new Promise(resolve => {
        this.showStartedCampaignPopup(connector, campaign, config, playerState, resolve);
      });
    } else if (campaign.status === "finished") {
      connector.callbacks?.stopAutoplay && connector.callbacks.stopAutoplay();
      this.updateActiveCampaignHeader(connector, campaign, config, playerState);
      return new Promise(resolve => {
        this.showFinishedCampaignPopup(connector, campaign, resolve);
      });
    } else if (campaign.status === "active") {
      connector.callbacks?.freezeBet && connector.callbacks.freezeBet(playerState.amount);
      this.updateActiveCampaignHeader(connector, campaign, config, playerState);
      this.activeCampaignId = campaign.campaignId;
      return new Promise(resolve => {
        this.showActiveCampaignPopup(connector, campaign, resolve);
      });
    }

    return {shouldIgnore: false, shouldRefresh: false};
  }

  async onExpired(connector: IConnector, campaign: Campaign): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}> {
    const {config, playerState} = await connector.getCampaign(campaign.campaignId);
    connector.callbacks?.stopAutoplay && connector.callbacks.stopAutoplay();
    this.updateActiveCampaignHeader(connector, campaign, config, playerState);
    return new Promise(resolve => {
      this.showFinishedCampaignPopup(connector, campaign, resolve);
    });
  }

  async onWager(connector: IConnector, campaign: Campaign): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}> {
    if (campaign.status === "active") {
      const {config, playerState} = await connector.getCampaign(campaign.campaignId);
      connector.callbacks?.freezeBet && connector.callbacks.freezeBet(playerState.amount);
      this.updateActiveCampaignHeader(connector, campaign, config, playerState);
    }
    return {shouldIgnore: false, shouldRefresh: false};
  }

  async onStopped(connector: IConnector, campaign: Campaign): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}> {
    const {config, playerState} = await connector.getCampaign(campaign.campaignId);

    if (campaign.status === "started") {
      return new Promise(resolve => {
        this.showStartedCampaignPopup(connector, campaign, config, playerState, resolve);
      });
    } else if (campaign.status === "active") {
      this.updateActiveCampaignHeader(connector, campaign, config, playerState);
    } else if (campaign.status === "finished") {
      connector.callbacks?.stopAutoplay && connector.callbacks.stopAutoplay();
      this.updateActiveCampaignHeader(connector, campaign, config, playerState);
      return new Promise(resolve => {
        this.showFinishedCampaignPopup(connector, campaign, resolve);
      });
    }

    return {shouldIgnore: false, shouldRefresh: false};
  }

  async onBetChanged(): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}> {
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

  private async showStartedCampaignPopup(connector: IConnector, campaign: Campaign, config: any, playerState: any, resolve: (value: any) => void) {
    const result = await this.overlayManager.showFreeBetsPopup(connector, campaign, 'started');
    console.log('[FreeBetsTool] showStartedCampaignPopup result:', result);

    if (result.action === 'optOut') {
      // User opted out - ignore the campaign but refresh to update state
      console.log('[FreeBetsTool] User opted out, refreshing campaign state');
      resolve({shouldIgnore: false, shouldRefresh: true});
    } else if (result.action === 'buttonClick') {
      // User started the campaign - activate it
      console.log('[FreeBetsTool] User started campaign, activating header');
      this.updateActiveCampaignHeader(connector, campaign, config, playerState);
      this.activeCampaignId = campaign.campaignId;
      resolve({shouldIgnore: false, shouldRefresh: false});
    } else {
      // User closed without action (close button) - ignore campaign
      console.log('[FreeBetsTool] User closed popup, ignoring campaign');
      resolve({shouldIgnore: true, shouldRefresh: false});
    }
  }

  private async showActiveCampaignPopup(_connector: IConnector, campaign: Campaign, resolve: (value: any) => void) {
    await this.overlayManager.showFreeBetsPopup(_connector, campaign, 'active');
    resolve({shouldIgnore: false, shouldRefresh: false});
  }

  private async showFinishedCampaignPopup(_connector: IConnector, campaign: Campaign, resolve: (value: any) => void) {
    const result = await this.overlayManager.showFreeBetsPopup(_connector, campaign, 'finished');

    if (result.action === 'buttonClick') {
      await _connector.acknowledgeCampaign(campaign.campaignId);
      _connector.ui().removePromoHeader('freeBets');
      _connector.callbacks?.unfreezeBet && _connector.callbacks.unfreezeBet();
      
      // Remove widget in standalone mode
      if (typeof window !== 'undefined' && (window as any).removePromoWidget) {
        (window as any).removePromoWidget('freeBets');
      }
      
      window.dispatchEvent(new CustomEvent('UPDATE_BALANCE_PREPAID_CAMPAIGN'));
      this.activeCampaignId = null;
      resolve({shouldIgnore: false, shouldRefresh: true});
      return;
    }

    resolve({shouldIgnore: false, shouldRefresh: false});
  }

  private updateActiveCampaignHeader(connector: IConnector, _campaign: Campaign, _config: any, playerState: any) {
    const used = playerState?.used || 0;
    const total = _config?.bets || 0;
    this.activeCampaignInfo = { used, total };

    // Use custom widget instead of addPromoHeader
    if (typeof window !== 'undefined' && (window as any).addPromoWidget) {
      (window as any).addPromoWidget(
        connector,
        'freeBets',
        _campaign,
        { amount: total },
        null,
        { available: total - used }
      );
    }
  }
}
