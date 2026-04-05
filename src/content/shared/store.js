// In-memory lookup store built from the seed dataset.
// The background service worker provides the data via chrome.runtime messaging.
(function () {
  'use strict';

  const { normalize } = window.AIML;

  const state = {
    byKey: new Map(),     // canonical key -> entry
    byName: new Map(),    // normalizedName -> entry
    loaded: false,
    enabled: true,
  };

  function ingest(dataset) {
    state.byKey.clear();
    state.byName.clear();
    if (!dataset || !Array.isArray(dataset.entries)) return;
    for (const e of dataset.entries) {
      const type = e.type || 'artist';
      if (e.normalizedName && !e.ambiguous) state.byName.set(type + ':' + e.normalizedName, e);
      const ids = e.platformIds || {};
      for (const platform of Object.keys(ids)) {
        for (const id of ids[platform] || []) {
          if (!id) continue;
          state.byKey.set(normalize.platformKey(platform, type, id), e);
        }
      }
    }
    state.loaded = true;
  }

  function lookup(keys) {
    for (const k of keys) {
      if (!k) continue;
      if (k.startsWith('name:')) {
        const hit = state.byName.get(k.slice(5));
        if (hit) return hit;
      } else {
        const hit = state.byKey.get(k);
        if (hit) return hit;
      }
    }
    return null;
  }

  function size() { return state.byName.size; }
  function isLoaded() { return state.loaded; }
  function setEnabled(v) { state.enabled = !!v; }
  function isEnabled() { return state.enabled; }

  async function loadFromBackground() {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: 'GET_DATASET' }, (res) => {
          if (chrome.runtime.lastError) { resolve(false); return; }
          if (res && res.dataset) {
            ingest(res.dataset);
            if (typeof res.enabled === 'boolean') state.enabled = res.enabled;
            resolve(true);
          } else {
            resolve(false);
          }
        });
      } catch (e) {
        resolve(false);
      }
    });
  }

  window.AIML.store = { ingest, lookup, size, isLoaded, setEnabled, isEnabled, loadFromBackground };
})();
