declare module '*.svelte' {
  import type { ComponentType, SvelteComponentTyped } from 'svelte';
  const component: ComponentType<SvelteComponentTyped<any, any, any>>;
  export default component;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module 'lottie-web' {
  export interface AnimationItem {
    play(): void;
    pause(): void;
    stop(): void;
    destroy(): void;
    setSpeed(speed: number): void;
    setDirection(direction: number): void;
    goToAndStop(value: number, isFrame?: boolean): void;
    goToAndPlay(value: number, isFrame?: boolean): void;
  }

  export interface AnimationConfig {
    container: Element;
    renderer: 'svg' | 'canvas' | 'html';
    loop?: boolean;
    autoplay?: boolean;
    animationData?: any;
    path?: string;
    rendererSettings?: any;
    name?: string;
  }

  export function loadAnimation(config: AnimationConfig): AnimationItem;
  export function destroy(name?: string): void;
  export function registerAnimation(element: Element, config: AnimationConfig): AnimationItem;
  export function setQuality(quality: string | number): void;

  const lottie: {
    loadAnimation: (config: AnimationConfig) => AnimationItem;
    destroy: (name?: string) => void;
    registerAnimation: (element: Element, config: AnimationConfig) => AnimationItem;
    setQuality: (quality: string | number) => void;
    play: (name?: string) => void;
    pause: (name?: string) => void;
    stop: (name?: string) => void;
    setSpeed: (speed: number, name?: string) => void;
    setDirection: (direction: number, name?: string) => void;
    searchAnimations: () => void;
    resize: () => void;
    goToAndStop: (value: number, isFrame?: boolean, name?: string) => void;
    goToAndPlay: (value: number, isFrame?: boolean, name?: string) => void;
    setSubframeRendering: (flag: boolean) => void;
    freeze: () => void;
    unfreeze: () => void;
    setVolume: (volume: number, name?: string) => void;
    mute: (name?: string) => void;
    unmute: (name?: string) => void;
    getRegisteredAnimations: () => AnimationItem[];
  };

  export default lottie;
}