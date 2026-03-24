# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies (first time setup)
npm run build        # Production build → dist/
npm run watch        # Development build with file watching
```

To load in Figma: Plugins → Development → Import plugin from manifest → select `manifest.json`.

## Architecture

This is a Figma plugin with two separate runtime environments that communicate via `postMessage`:

- **`src/code.ts`** — runs in Figma's sandboxed JS environment. Has access to the Figma API (`figma.*`) but no DOM. Handles text node insertion and calls `figma.showUI(__html__)` to launch the panel.
- **`src/ui.ts`** — runs in a browser iframe (the plugin panel). Has DOM access but no Figma API access. Sends messages to `code.ts` via `parent.postMessage({ pluginMessage: ... }, '*')`.

Webpack compiles both entry points to `dist/`. `HtmlWebpackPlugin` generates `dist/ui.html` from `src/ui.html`, injecting the compiled `ui.js` into the body.

## Data

`terms.json` at the project root is the single source of truth for terminology. It is imported directly into `src/ui.ts` and bundled — no network requests are made at runtime.

### Schema
```json
{
  "term": "string (required)",
  "definition": "string (required)",
  "usage": "string (required)",
  "context": ["Navigation","Actions","Inputs","Feedback","Errors","Onboarding","Account","Marketing","Legal","System"],
  "variants": ["string"],
  "dont": ["string"],
  "caution": ["string"],
  "notes": "string"
}
```

To add or update terms, edit `terms.json` and rebuild.

## Key constraints

- The plugin panel is 320×500px (set in `code.ts` `showUI` call).
- Figma's sandbox has no `fetch`, `localStorage`, or DOM — keep all data bundled.
- Before inserting text into a node, the font must be loaded with `figma.loadFontAsync()`. Mixed-font text nodes are not supported for insertion.
- `manifest.json` contains a placeholder plugin `id`. Replace it with the real ID from the Figma plugin registry before publishing.
