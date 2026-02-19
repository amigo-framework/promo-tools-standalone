// Main entry point for Promo Tools Standalone
// Exports all tools and utilities

export * from './tools/PrizeDropTool';
export * from './tools/FreeBetsTool';
export * from './tools/TournamentTool';
export * from './interfaces/IPromoTool';
export * from './shared/SvelteComponents';

import { PrizeDropTool } from './tools/PrizeDropTool';
import { FreeBetsTool } from './tools/FreeBetsTool';
import { TournamentTool } from './tools/TournamentTool';
import { SvelteOverlayManager } from './shared/SvelteComponents';

// Collection of all available tools
export const PromoTools = {
  PrizeDropTool,
  FreeBetsTool,
  TournamentTool,
  SvelteOverlayManager,
};

// Auto-registration utility
export function registerAllPromoTools() {
  console.log('[PROMO TOOLS] registerAllPromoTools called');
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
}

// Global utility to close current popup
export function closeCurrentPromoPopup() {
  console.log('[PROMO TOOLS] closeCurrentPromoPopup called');
  const overlayManager = SvelteOverlayManager.getInstance();
  overlayManager.closeCurrentPopup();
}

// Expose globally for connector access
if (typeof window !== 'undefined') {
  (window as any).closeCurrentPromoPopup = closeCurrentPromoPopup;

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