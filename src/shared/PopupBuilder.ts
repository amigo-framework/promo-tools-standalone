import type { SvelteComponent } from 'svelte';
import PopupOverlay from '@/components/PopupOverlay.svelte';

export interface PopupButton {
  label: string;
  primary?: boolean;
  secondary?: boolean;
  callback: () => void | Promise<void>;
}

/**
 * Builder class to construct Svelte popups with a similar API to PixiPopup
 */
export class PopupBuilder {
  private title: string = '';
  private textContent: string[] = [];
  private buttons: PopupButton[] = [];
  private width: number = 400;
  private height: number = 300;
  private backgroundColor: string = '#1a1a2e';
  private borderColor: string = '#16213e';
  private showCloseButton: boolean = false;
  private closeCallback: (() => void) | null = null;

  constructor(width: number, height: number, bgColorHex: number, borderColorHex: number, _borderWidth?: number) {
    this.width = width;
    this.height = height;
    this.backgroundColor = `#${bgColorHex.toString(16).padStart(6, '0')}`;
    this.borderColor = `#${borderColorHex.toString(16).padStart(6, '0')}`;
  }

  addTitle(text: string, style?: { fontSize?: number; fill?: number }): void {
    const color = style?.fill ? `#${style.fill.toString(16).padStart(6, '0')}` : '#ffd700';
    const fontSize = style?.fontSize || 28;
    this.title = `<span style="color: ${color}; font-size: ${fontSize}px;">${text}</span>`;
  }

  addText(text: string, _yOffset?: number, style?: { fontSize?: number; fill?: number; align?: string; fontWeight?: string }): void {
    const color = style?.fill ? `#${style.fill.toString(16).padStart(6, '0')}` : '#ffffff';
    const fontSize = style?.fontSize || 16;
    const align = style?.align || 'center';
    
    this.textContent.push(
      `<p style="color: ${color}; font-size: ${fontSize}px; text-align: ${align}; margin: 8px 0;">${text}</p>`
    );
  }

  addButton(label: string, _x: number, _y: number, callback: () => void | Promise<void>, colorHex?: number): void {
    this.buttons.push({
      label,
      callback,
      primary: !colorHex || colorHex !== 0x666666,
      secondary: colorHex === 0x666666
    });
  }

  addCloseButton(callback?: () => void): void {
    this.showCloseButton = true;
    if (callback) {
      this.closeCallback = callback;
    }
  }

  centerOnScreen(_screenWidth: number, _screenHeight: number): void {
    // Not needed for Svelte - it centers automatically
  }

  mount(container: HTMLElement, onClose?: () => void): SvelteComponent {
    const popup = new PopupOverlay({
      target: container,
      props: {
        visible: true,
        title: '',
        message: `
          ${this.title ? `<div style="margin-bottom: 20px;">${this.title}</div>` : ''}
          <div>${this.textContent.join('')}</div>
          ${this.buttons.length > 0 ? `
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
              ${this.buttons.map(btn => `
                <button 
                  class="${btn.primary ? 'primary' : btn.secondary ? 'secondary' : ''}" 
                  data-action="${btn.label}"
                  style="
                    padding: 10px 20px;
                    border-radius: 8px;
                    border: none;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    background: ${btn.secondary ? '#666666' : '#4caf50'};
                    color: white;
                  "
                >
                  ${btn.label}
                </button>
              `).join('')}
            </div>
          ` : ''}
        `,
        width: this.width,
        height: this.height,
        backgroundColor: this.backgroundColor,
        borderColor: this.borderColor,
        showCloseButton: this.showCloseButton
      }
    });

    // Add event listeners for buttons
    setTimeout(() => {
      this.buttons.forEach(btn => {
        const buttonEl = container.querySelector(`button[data-action="${btn.label}"]`);
        if (buttonEl) {
          buttonEl.addEventListener('click', async () => {
            await btn.callback();
          });
        }
      });
    }, 100);

    // Handle close events
    popup.$on('close', () => {
      if (this.closeCallback) {
        this.closeCallback();
      }
      if (onClose) {
        onClose();
      }
    });

    popup.$on('backdropClick', () => {
      if (onClose) {
        onClose();
      }
    });

    return popup;
  }
}
