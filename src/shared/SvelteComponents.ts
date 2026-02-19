import PrizeDropPopup from '../components/PrizeDropPopup.svelte';
import FreeBetsPopup from '../components/FreeBetsPopup.svelte';
import TournamentPopup from '../components/TournamentPopup.svelte';
import type { IConnector, Campaign } from '../interfaces/IPromoTool';

export class SvelteOverlayManager {
  private static instance: SvelteOverlayManager | null = null;
  private container: HTMLDivElement | null = null;
  private currentComponent: any = null;

  static getInstance(): SvelteOverlayManager {
    if (!SvelteOverlayManager.instance) {
      SvelteOverlayManager.instance = new SvelteOverlayManager();
    }
    return SvelteOverlayManager.instance;
  }

  async init(): Promise<void> {
    console.log('[SvelteOverlayManager] init() called');
    if (!this.container) {
      console.log('[SvelteOverlayManager] Creating container div');
      
      // Create container with maximum z-index like react-modal does
      this.container = document.createElement('div');
      this.container.id = 'promo-tools-overlay';
      this.container.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
      `;
      
      console.log('[SvelteOverlayManager] Container created:', this.container);
      document.body.appendChild(this.container);
      console.log('[SvelteOverlayManager] Container appended to body');
      console.log('[SvelteOverlayManager] Body children count:', document.body.children.length);
    } else {
      console.log('[SvelteOverlayManager] Container already exists');
    }
  }

  async showPrizeDropPopup(connector: IConnector, campaign: Campaign, mode: 'started' | 'active' | 'finished' | 'prizeWon', prizeWonData?: any): Promise<{action: string}> {
    console.log('[SvelteOverlayManager] showPrizeDropPopup called with:', {connector, campaign, mode, prizeWonData});
    return new Promise((resolve) => {
      console.log('[SvelteOverlayManager] Creating promise for PrizeDropPopup');
      try {
        this.showComponent(PrizeDropPopup, {
          connector,
          campaign,
          mode,
          prizeWonData
        }, resolve);
      } catch (error) {
        console.error('[SvelteOverlayManager] Error in showComponent:', error);
        resolve({action: 'error'});
      }
    });
  }

  async showFreeBetsPopup(connector: IConnector, campaign: Campaign, mode: 'started' | 'active' | 'finished'): Promise<{action: string}> {
    return new Promise((resolve) => {
      this.showComponent(FreeBetsPopup, {
        connector,
        campaign,
        mode
      }, resolve);
    });
  }

  async showTournamentPopup(
    connector: IConnector,
    campaign: Campaign,
    mode: 'started' | 'active' | 'finished',
    initialData?: {config: any; campaignState: any; playerState: any}
  ): Promise<{action: string}> {
    return new Promise((resolve) => {
      this.showComponent(TournamentPopup, {
        connector,
        campaign,
        mode,
        initialData,
      }, resolve);
    });
  }

  private showComponent(component: any, props: any, resolve: (value: {action: string}) => void): void {
    console.log('[SvelteOverlayManager] showComponent called with:', {component, props});
    
    if (!this.container) {
      console.error('[SvelteOverlayManager] No container available');
      throw new Error('Overlay manager not initialized');
    }

    console.log('[SvelteOverlayManager] Container exists, clearing current component');
    this.clearCurrentComponent();

    try {
      console.log('[SvelteOverlayManager] Creating new component instance');
      this.currentComponent = new component({
        target: this.container,
        props: props
      });
      const componentRef = this.currentComponent;
      console.log('[SvelteOverlayManager] Component created successfully:', this.currentComponent);

      console.log('[SvelteOverlayManager] Setting up event listeners');
      this.currentComponent.$on('close', () => {
        console.log('[SvelteOverlayManager] Close event received');
        resolve({action: 'close'});
        // Clear only if this is still the active component
        if (this.currentComponent === componentRef) {
          this.clearCurrentComponent();
        }
      });

      this.currentComponent.$on('buttonClick', (event: CustomEvent<{action?: string}>) => {
        console.log('[SvelteOverlayManager] ButtonClick event received');
        resolve({action: event?.detail?.action || 'buttonClick'});
        // Defer cleanup; guard against destroying a newly opened popup.
        setTimeout(() => {
          if (this.currentComponent === componentRef) {
            this.clearCurrentComponent();
          }
        }, 0);
      });
      
      console.log('[SvelteOverlayManager] Component setup complete');
    } catch (error) {
      console.error('[SvelteOverlayManager] Error creating component:', error);
      throw error;
    }
  }

  private clearCurrentComponent(): void {
    if (this.currentComponent) {
      this.currentComponent.$destroy();
      this.currentComponent = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  destroy(): void {
    this.clearCurrentComponent();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }

  // Public method to close current popup
  closeCurrentPopup(): void {
    console.log('[SvelteOverlayManager] closeCurrentPopup called');
    if (this.currentComponent && typeof this.currentComponent.closePopup === 'function') {
      this.currentComponent.closePopup();
    } else {
      // Fallback: clear component
      this.clearCurrentComponent();
    }
  }
}
