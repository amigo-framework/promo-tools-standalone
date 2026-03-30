// Main entry point for Promo Tools Standalone
// Exports all tools and utilities

export * from './tools/PrizeDropTool';
export * from './tools/FreeBetsTool';
export * from './tools/TournamentTool';
export * from './interfaces/IPromoTool';
export * from './shared/SvelteComponents';

// Export widget components
export { default as FreeBetsWidget } from './components/FreeBetsWidget.svelte';
export { default as PrizeDropWidget } from './components/PrizeDropWidget.svelte';
export { default as TournamentWidget } from './components/TournamentWidget.svelte';
export { default as WidgetManager } from './components/WidgetManager.svelte';

import { PrizeDropTool } from './tools/PrizeDropTool';
import { FreeBetsTool } from './tools/FreeBetsTool';
import { TournamentTool } from './tools/TournamentTool';
import { SvelteOverlayManager } from './shared/SvelteComponents';
import WidgetManager from './components/WidgetManager.svelte';
import type { IConnector, Campaign } from './interfaces/IPromoTool';

// Collection of all available tools
export const PromoTools = {
  PrizeDropTool,
  FreeBetsTool,
  TournamentTool,
  SvelteOverlayManager,
  WidgetManager,
};

// Auto-registration utility
export async function registerAllPromoTools() {
  console.log('[PROMO TOOLS] registerAllPromoTools called');
  
  // Initialize overlay manager for widgets system
  const overlayManager = SvelteOverlayManager.getInstance();
  await overlayManager.init();
  console.log('[PROMO TOOLS] Overlay manager initialized');
  
  if (typeof window !== 'undefined' && (window as any).registerPromoTool) {
    (window as any).registerPromoTool('prize_drop', PrizeDropTool);
    (window as any).registerPromoTool('free_bets', FreeBetsTool);
    (window as any).registerPromoTool('tournament', TournamentTool);
    
    console.log('[PROMO TOOLS] All tools registered successfully:', [
      'prize_drop',
      'free_bets', 
      'tournament'
    ]);
  } else {
    console.warn('[PROMO TOOLS] Registration function not available on window');
  }
  
  // Expose global widget functions on window
  if (typeof window !== 'undefined') {
    (window as any).addPromoWidget = addPromoWidget;
    (window as any).removePromoWidget = removePromoWidget;
    (window as any).updatePromoWidget = updatePromoWidget;
    (window as any).clearAllPromoWidgets = clearAllPromoWidgets;
    (window as any).openFreeBetsPopup = openFreeBetsPopup;
    (window as any).openPrizeDropPopup = openPrizeDropPopup;
    (window as any).openTournamentPopup = openTournamentPopup;
    (window as any).closeCurrentPromoPopup = closeCurrentPromoPopup;
    
    console.log('[PROMO TOOLS] Global widget functions exposed');
  }
}

// Global utility to close current popup
export function closeCurrentPromoPopup() {
  console.log('[PROMO TOOLS] closeCurrentPromoPopup called');
  const overlayManager = SvelteOverlayManager.getInstance();
  overlayManager.closeCurrentPopup();
}

// Global widget management utilities
export function addPromoWidget(
  connector: IConnector,
  type: 'freeBets' | 'prizeDrop' | 'tournament',
  campaign: Campaign,
  config: any,
  campaignState: any,
  playerState: any
) {
  console.log('[PROMO TOOLS] addPromoWidget called:', type);
  const overlayManager = SvelteOverlayManager.getInstance();
  overlayManager.addPromoWidget(connector, type, campaign, config, campaignState, playerState);
}

export function removePromoWidget(type: 'freeBets' | 'prizeDrop' | 'tournament') {
  console.log('[PROMO TOOLS] removePromoWidget called:', type);
  const overlayManager = SvelteOverlayManager.getInstance();
  overlayManager.removePromoWidget(type);
}

export function updatePromoWidget(
  connector: IConnector,
  type: 'freeBets' | 'prizeDrop' | 'tournament',
  campaign: Campaign,
  config: any,
  campaignState: any,
  playerState: any
) {
  console.log('[PROMO TOOLS] updatePromoWidget called:', type);
  const overlayManager = SvelteOverlayManager.getInstance();
  overlayManager.updatePromoWidget(connector, type, campaign, config, campaignState, playerState);
}

export function clearAllPromoWidgets() {
  console.log('[PROMO TOOLS] clearAllPromoWidgets called');
  const overlayManager = SvelteOverlayManager.getInstance();
  overlayManager.clearAllWidgets();
}

// Global functions to open popups directly from widgets
export function openFreeBetsPopup(
  connector: IConnector,
  campaign: Campaign,
  mode: 'started' | 'active' | 'finished'
): Promise<{action: string}> {
  console.log('[PROMO TOOLS] openFreeBetsPopup called:', mode);
  const overlayManager = SvelteOverlayManager.getInstance();
  return overlayManager.showFreeBetsPopup(connector, campaign, mode);
}

export function openPrizeDropPopup(
  connector: IConnector,
  campaign: Campaign,
  mode: 'started' | 'active' | 'finished' | 'prizeWon',
  prizeWonData?: any
): Promise<{action: string}> {
  console.log('[PROMO TOOLS] openPrizeDropPopup called:', mode);
  const overlayManager = SvelteOverlayManager.getInstance();
  return overlayManager.showPrizeDropPopup(connector, campaign, mode, prizeWonData);
}

export function openTournamentPopup(
  connector: IConnector,
  campaign: Campaign,
  mode: 'started' | 'active' | 'finished',
  initialData?: {config: any; campaignState: any; playerState: any}
): Promise<{action: string}> {
  console.log('[PROMO TOOLS] openTournamentPopup called:', mode);
  const overlayManager = SvelteOverlayManager.getInstance();
  return overlayManager.showTournamentPopup(connector, campaign, mode, initialData);
}

// Expose globally for connector access
if (typeof window !== 'undefined') {
  (window as any).closeCurrentPromoPopup = closeCurrentPromoPopup;
  (window as any).addPromoWidget = addPromoWidget;
  (window as any).removePromoWidget = removePromoWidget;
  (window as any).updatePromoWidget = updatePromoWidget;
  (window as any).clearAllPromoWidgets = clearAllPromoWidgets;
  (window as any).openFreeBetsPopup = openFreeBetsPopup;
  (window as any).openPrizeDropPopup = openPrizeDropPopup;
  (window as any).openTournamentPopup = openTournamentPopup;

  // Auto-register tools when connector registry is available
  if ((window as any).registerPromoTool) {
    registerAllPromoTools();
  } else {
    console.warn('[PROMO TOOLS] registerPromoTool not found at load time');
  }
}

// Version info
export const VERSION = '1.0.0';

console.log(`[PROMO TOOLS] Standalone package v${VERSION} loaded`);
console.log('[PROMO TOOLS] 🚨🚨🚨 CACHE BUSTER v3.4 FRESH BUILD 🚨🚨🚨', new Date().toISOString());