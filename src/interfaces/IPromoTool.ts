/**
 * Interface that external promo tools must implement to work with the connector
 */
export interface Campaign {
  campaignId: string;
  type: string;
  status: 'planned' | 'started' | 'active' | 'finished' | 'expired';
  end?: string;
}

/**
 * Connector interface that promo tools receive
 */
export interface IConnector {
  getCampaign(campaignId: string, includePlayerState?: boolean): Promise<{
    config: any;
    campaignState: any; 
    playerState: any;
  }>;
  getCampaigns(): Promise<Campaign[]>;
  optCampaign(campaignId: string, optIn: boolean): Promise<void>;
  acknowledgeCampaign(campaignId: string): Promise<void>;
  ui(): IConnectorUI;
  formatCurrency(value: number, currencySymbol?: string, language?: string, currencyDecimals?: number): string;
  balance(): Promise<{balance: number}>;
  settings: Record<string, any>;
  bets: IBets | undefined;
  callbacks?: IConnectorCallbacks;
  emitter: IEventEmitter;
  getCurrentBetAmount?(): number;
}

export interface IConnectorUI {
  showPopup(popup: IPopup): void;
  hidePopup(data?: {showNextPopup: boolean}): void;
  addPromoHeader(campaignType: string, icon: any, value: string, label: string, onClick?: () => any, alert?: any): void;
  removePromoHeader(campaignType: string): void;
  getTheme(): any;
}

export interface IPopup {
  title?: string;
  message: any;
  buttons?: Array<{
    label: string;
    primary?: boolean;
    secondary?: boolean;
    callback: () => void | Promise<void>;
    preventClose?: boolean;
  }>;
}

export interface IBets {
  [key: string]: {
    available: number[] | {min: number; max: number; step: number};
    default: number;
    coin: number;
  };
}

export interface IConnectorCallbacks {
  stopAutoplay?: () => void;
  freezeBet?: (bet: number) => void;
  unfreezeBet?: () => void;
  balanceChanged?: (balance: number) => void;
  mute?: () => void;
  unmute?: () => void;
  turboToggle?: (value: boolean) => void;
  paytableToggle?: (value: boolean) => void;
  helpToggle?: (value: boolean) => void;
  aboutToggle?: (value: boolean) => void;
  play?: (action: string, bet: number) => void;
  popupOpened?: (count: number) => void;
  popupClosed?: (count: number) => void;
  openGameHistory?: () => void;
  freeze?: () => void;
  unfreeze?: () => void;
  spinToggle?: (value: boolean) => void;
}

export interface IEventEmitter {
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
  emit(event: string, data?: any): void;
}

/**
 * Standard interface that all external promo tools must implement
 */
export interface IPromoTool {
  init(connector: IConnector, campaign: Campaign): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}>;
  onExpired(connector: IConnector, campaign: Campaign): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}>;
  onWager(connector: IConnector, campaign: Campaign, data: any): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}>;
  onStopped(connector: IConnector, campaign: Campaign, data: any): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}>;
  onBetChanged(connector: IConnector, campaign: Campaign, data: any): Promise<{shouldIgnore: boolean; shouldRefresh: boolean}>;
  getActiveCampaignId(): string | null;
  getActiveCampaignInfo(): any;
  destroy?(): void; // Optional cleanup method
}

/**
 * Configuration for PIXI overlays 
 */
export interface IPixiOverlayConfig {
  width?: number;
  height?: number;
  backgroundColor?: number;
  backgroundAlpha?: number;
  zIndex?: number;
  position?: 'fullscreen' | 'center' | 'top' | 'bottom';
}