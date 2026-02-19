# Promo Tools Standalone

This repository contains external promo tools for the Connector, implemented in Svelte and bundled as a UMD/ES library.

## What this project does

It provides external implementations for promo campaign UIs:

- `prize_drop`
- `free_bets`
- `tournament`

At runtime, the Connector loads this bundle (for example from `http://localhost:4001/dist/promo-tools.umd.js`) and uses these tools instead of internal React promo tools.

---

## Project structure

- `src/index.ts`  
  Entry point. Registers all external tools via `window.registerPromoTool(...)`.

- `src/tools/`  
  Tool controllers (`PrizeDropTool`, `FreeBetsTool`, `TournamentTool`) implementing the promo tool interface expected by the Connector.

- `src/components/`  
  Svelte popup components for each campaign type.

- `src/shared/SvelteComponents.ts`  
  Overlay manager used to mount/unmount popup components and route popup events.

- `src/interfaces/IPromoTool.ts`  
  Contract for external tools (`init`, `onExpired`, `onWager`, `onStopped`, `onBetChanged`, etc.) and connector UI methods.

- `src/assets/`  
  Promo images and button sprites.

- `dist/`  
  Build output (`promo-tools.umd.js`, `promo-tools.es.js`, styles, typings).

---

## How it connects to Connector

1. Connector initializes promo UI.
2. Connector exposes `window.registerPromoTool` and loads the external script.
3. This package registers tools in `src/index.ts`:
   - `registerPromoTool('prize_drop', PrizeDropTool)`
   - `registerPromoTool('free_bets', FreeBetsTool)`
   - `registerPromoTool('tournament', TournamentTool)`
4. Connector resolves campaign type to external tool and executes lifecycle methods.
5. Tools use Connector APIs (`getCampaign`, `optCampaign`, `acknowledgeCampaign`, `ui().addPromoHeader`, `ui().showPopup`, etc.).

---

## Local development

### Install dependencies

```bash
npm install
```

### Run dev server (serves bundle on port 4001)

```bash
npm run dev
```

### Build

```bash
npm run build
```

Build artifacts are generated in `dist/`.

### Preview built output

```bash
npm run preview
```

---

## Connector setup notes

Connector must point to this bundle URL, typically:

- `http://localhost:4001/dist/promo-tools.umd.js`

If loading succeeds, Connector logs that external promo tools are registered and used.

---

## Useful scripts

- `npm run dev` → Vite dev server (host `0.0.0.0`, port `4001`)
- `npm run build` → TypeScript + Vite production build
- `npm run build:watch` → Vite watch build
- `npm run type-check` → Svelte/TypeScript checks
- `npm run clean` → remove `dist/`

---

## Quick troubleshooting

- No external tools loaded:
  - Verify Connector can reach the UMD URL.
  - Verify script is built and available in `dist/`.
  - Check browser console for `[CONNECTOR]` and `[PROMO TOOLS]` logs.

- Popup appears but behavior is wrong:
  - Verify campaign payload from `connector.getCampaign(...)`.
  - Compare with Connector React reference behavior for the same campaign type.
