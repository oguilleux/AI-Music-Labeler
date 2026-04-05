# AI Music Labeler — Chrome Extension (V1, beta)

> This extension is currently in **beta**.

Adds a small **AI** badge next to artist/track names identified as AI-generated on:

- Spotify web (`open.spotify.com`)
- YouTube Music (`music.youtube.com`)
- YouTube (`www.youtube.com`)

V1 ships with a curated JSON database of known AI artists (`extension/data/ai-artists.json`). No backend, no tracking.

## Install (unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder in this repo
5. Pin the extension, open one of the supported music platforms, and search for e.g. *The Velvet Sundown*

## Project layout

```
extension/
├── manifest.json
├── src/
│   ├── background/service-worker.js
│   ├── content/
│   │   ├── entry.js
│   │   ├── shared/       # labeler, badge, observer, store, normalize
│   │   └── platforms/    # spotify, youtube-music, youtube
│   ├── popup/            # popup.html / .js / .css
│   └── common/config.js
├── data/ai-artists.json  # curated seed database
└── assets/               # icons
```

## How it works

- Each content script loads on the target hosts, detects the current platform, and reads the curated dataset from the background service worker.
- A single `MutationObserver` (debounced via `requestIdleCallback`) watches the page for added nodes.
- SPA navigation is captured by patching `history.pushState/replaceState` and listening to `popstate`.
- The platform adapter extracts artist/track candidates from the DOM (anchors pointing to `/artist/`, `/track/`, `channel/`, etc.) and builds lookup keys (`platform:type:id` + `name:normalized`).
- Matches inject a purple **AI** badge hosted in a closed Shadow DOM (zero CSS leakage).

## Updating the curated list

Edit `extension/data/ai-artists.json` and click **Reload bundled database** in the popup (or reload the extension from `chrome://extensions`).

Schema: see the existing entries. Each entry needs at minimum `displayName`, `normalizedName`, `type` (`artist`/`track`), and ideally platform IDs for precise matching.

## Roadmap

### V2
- Community flagging (100 distinct flags → label auto-added) backed by Cloudflare Workers + D1
- Anti-abuse: HMAC install IDs, per-IP rate limits, geo-diversity checks
