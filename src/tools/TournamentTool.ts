import type { IPromoTool, IConnector, Campaign } from '@/interfaces/IPromoTool';
import { SvelteOverlayManager } from '@/shared/SvelteComponents';

export class TournamentTool implements IPromoTool {
  private activeCampaignId: string | null = null;
  private activeCampaignInfo: {playerRank: number | string; totalPositions: number} | null = null;
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
      await this.showFinishedCampaignPopup(connector, campaign, config, campaignState, playerState);
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
    await this.showFinishedCampaignPopup(connector, campaign, config, campaignState, playerState);
    return {shouldIgnore: false, shouldRefresh: true};
  }

  async onWager(): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}> {
    return {shouldIgnore: false, shouldRefresh: false};
  }

  async onStopped(connector: IConnector, campaign: Campaign): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}> {
    const {config, campaignState, playerState} = await connector.getCampaign(campaign.campaignId);

    if (campaign.status === "started") {
      return new Promise(resolve => {
        this.showStartedCampaignPopup(connector, campaign, config, campaignState, playerState, resolve);
      });
    }

    if (campaign.status === "active" || campaign.status === "finished") {
      this.updateActiveCampaignHeader(connector, campaign, config, campaignState, playerState);
    }

    if (campaign.status === "finished") {
      await this.showFinishedCampaignPopup(connector, campaign, config, campaignState, playerState);
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

  private async showStartedCampaignPopup(connector: IConnector, campaign: Campaign, _config: any, _campaignState: any, _playerState: any, resolve: (value: any) => void) {
    const result = await this.overlayManager.showTournamentPopup(connector, campaign, 'started', {
      config: _config,
      campaignState: _campaignState,
      playerState: _playerState,
    });

    if (result.action === 'start' || result.action === 'buttonClick') {
      const latest = await connector.getCampaign(campaign.campaignId);
      this.updateActiveCampaignHeader(connector, campaign, latest.config, latest.campaignState, latest.playerState);
      this.activeCampaignId = campaign.campaignId;
      resolve({shouldIgnore: false, shouldRefresh: false});
    } else if (result.action === 'optOut') {
      resolve({shouldIgnore: false, shouldRefresh: true});
    } else {
      resolve({shouldIgnore: true, shouldRefresh: false});
    }
  }

  private async showActiveCampaignPopup(_connector: IConnector, campaign: Campaign, _config: any, _campaignState: any, _playerState: any, resolve: (value: any) => void) {
    await this.overlayManager.showTournamentPopup(_connector, campaign, 'active', {
      config: _config,
      campaignState: _campaignState,
      playerState: _playerState,
    });
    resolve({shouldIgnore: false, shouldRefresh: false});
  }

  private async showFinishedCampaignPopup(_connector: IConnector, campaign: Campaign, _config: any, _campaignState: any, _playerState: any) {
    let acknowledged = false;
    try {
      const result = await this.overlayManager.showTournamentPopup(_connector, campaign, 'finished', {
        config: _config,
        campaignState: _campaignState,
        playerState: _playerState,
      });

      if (result.action === 'buttonClick' || result.action === 'close') {
        await _connector.acknowledgeCampaign(campaign.campaignId);
        _connector.ui().removePromoHeader('tournament');
        this.activeCampaignId = null;
        acknowledged = true;

        if (_connector.callbacks?.balanceChanged) {
          const {balance} = await _connector.balance();
          _connector.callbacks.balanceChanged(balance);
        }
      }
    } finally {
      if (!acknowledged) {
        await _connector.acknowledgeCampaign(campaign.campaignId);
        _connector.ui().removePromoHeader('tournament');
        this.activeCampaignId = null;
      }
    }
  }

  private updateActiveCampaignHeader(connector: IConnector, _campaign: Campaign, _config: any, campaignState: any, playerState: any) {
    const roundIds = campaignState?.leaderboard?.roundIds || [];
    const playerRoundId = playerState?.leaderboardRoundId;
    const rankIndex = playerRoundId != null ? roundIds.findIndex((roundId: string) => roundId === playerRoundId) : -1;
    const playerRank = rankIndex >= 0 ? rankIndex + 1 : '-';
    const totalPositions = roundIds.length;
    this.activeCampaignInfo = { playerRank, totalPositions };

    // Use custom widget instead of addPromoHeader
    if (typeof window !== 'undefined' && (window as any).addPromoWidget) {
      (window as any).addPromoWidget(
        connector,
        'tournament',
        _campaign,
        _config,
        { leaderboard: roundIds.map((_: any, index: number) => ({ playerId: `player_${index}` })) },
        { playerId: 'currentPlayer' }
      );
    }
  }
}
