# Privacy Policy — AI Music Labeler

**Last updated: April 6, 2026**

## Summary

AI Music Labeler does not collect, store, or transmit any personal data.

## Data collection

This extension collects **no personal data** of any kind. It does not collect, store, transmit, or share:

- Personal identification information
- Browsing history
- Financial or authentication information
- Location data
- User activity

## Local storage

The extension uses `chrome.storage.local` exclusively to:

- **Cache the bundled dataset** — a list of AI-generated artists included in the extension package, to avoid reloading it from disk on every page load.
- **Store the user's preference** — a single boolean (enabled/disabled) set by the user via the extension popup.

This data never leaves the user's device and is never transmitted to any server.

## Content scripts

The extension injects content scripts into Spotify, YouTube Music, and YouTube to read artist names and IDs displayed in the page DOM. This information is matched locally against the bundled dataset to display a visual badge. No DOM data is stored or sent anywhere.

## Remote code

The extension does not use any remote code. All JavaScript and data are included in the extension package.