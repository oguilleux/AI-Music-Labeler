// Entry point: detects the active platform and wires up observer + labeler.
(function () {
  'use strict';

  const { platforms, observer, labeler, store } = window.AIML;

  function detectPlatform() {
    const host = location.hostname;
    if (host === 'open.spotify.com') return platforms.spotify;
    if (host === 'music.youtube.com') return platforms.ytmusic;
    if (host === 'www.youtube.com') return platforms.youtube;
    return null;
  }

  async function boot() {
    const platform = detectPlatform();
    if (!platform) return;

    const ok = await store.loadFromBackground();
    if (!ok) {
      console.warn('[AIML] could not load dataset from background');
      return;
    }

    const run = (nodes) => labeler.scan(nodes, platform);

    const handle = observer.startObserver(document.body || document.documentElement, run);

    observer.onUrlChange(() => {
      // Force a full rescan on SPA nav.
      labeler.clearBadges();
      handle.forceScan();
    });

    // Listen to toggle messages from the popup (via background service worker).
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (!msg || !msg.type) return;
      // Only accept messages originating from our own extension (background/popup).
      // Messages from other content scripts or web pages have sender.tab set or a
      // mismatched id and must be rejected.
      if (!sender || sender.id !== chrome.runtime.id || sender.tab) return;
      if (msg.type === 'SET_ENABLED') {
        store.setEnabled(!!msg.enabled);
        if (!msg.enabled) {
          labeler.clearBadges();
        } else {
          handle.forceScan();
        }
        sendResponse && sendResponse({ ok: true });
      } else if (msg.type === 'DATASET_UPDATED') {
        store.ingest(msg.dataset);
        labeler.clearBadges();
        handle.forceScan();
        sendResponse && sendResponse({ ok: true });
      }
      return true;
    });
  }

  boot();
})();
