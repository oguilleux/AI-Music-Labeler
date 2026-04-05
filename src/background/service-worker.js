// Background service worker (MV3).
// Loads the bundled dataset, persists user settings, serves content scripts and popup.

const DATASET_URL = chrome.runtime.getURL('data/ai-artists.json');
const STORAGE_KEYS = { dataset: 'dataset', enabled: 'enabled', lastLoaded: 'lastLoaded' };

async function loadBundledDataset() {
  const res = await fetch(DATASET_URL);
  if (!res.ok) throw new Error('Failed to fetch bundled dataset: ' + res.status);
  return res.json();
}

async function getDataset() {
  const cached = await chrome.storage.local.get([STORAGE_KEYS.dataset]);
  if (cached[STORAGE_KEYS.dataset]) return cached[STORAGE_KEYS.dataset];
  const dataset = await loadBundledDataset();
  await chrome.storage.local.set({
    [STORAGE_KEYS.dataset]: dataset,
    [STORAGE_KEYS.lastLoaded]: Date.now(),
  });
  return dataset;
}

async function getEnabled() {
  const { enabled } = await chrome.storage.local.get([STORAGE_KEYS.enabled]);
  return enabled !== false; // default true
}

async function setEnabled(v) {
  await chrome.storage.local.set({ [STORAGE_KEYS.enabled]: !!v });
}

async function reloadBundled() {
  const dataset = await loadBundledDataset();
  await chrome.storage.local.set({
    [STORAGE_KEYS.dataset]: dataset,
    [STORAGE_KEYS.lastLoaded]: Date.now(),
  });
  return dataset;
}

async function broadcastToTabs(message) {
  const tabs = await chrome.tabs.query({
    url: [
      'https://open.spotify.com/*',
      'https://music.youtube.com/*',
      'https://music.apple.com/*',
    ],
  });
  for (const t of tabs) {
    try { await chrome.tabs.sendMessage(t.id, message); } catch (_) { /* tab may not have CS */ }
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  try { await getDataset(); } catch (e) { console.error('[AIML] install load error', e); }
});

chrome.runtime.onStartup.addListener(async () => {
  try { await getDataset(); } catch (e) { console.error('[AIML] startup load error', e); }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || !msg.type) return;

  (async () => {
    try {
      switch (msg.type) {
        case 'GET_DATASET': {
          const dataset = await getDataset();
          const enabled = await getEnabled();
          sendResponse({ dataset, enabled });
          break;
        }
        case 'GET_STATS': {
          const dataset = await getDataset();
          const enabled = await getEnabled();
          const { lastLoaded } = await chrome.storage.local.get([STORAGE_KEYS.lastLoaded]);
          sendResponse({
            count: (dataset.entries || []).length,
            version: dataset.version,
            updated: dataset.updated,
            enabled,
            lastLoaded: lastLoaded || null,
          });
          break;
        }
        case 'SET_ENABLED': {
          await setEnabled(msg.enabled);
          await broadcastToTabs({ type: 'SET_ENABLED', enabled: !!msg.enabled });
          sendResponse({ ok: true });
          break;
        }
        case 'RELOAD_DATASET': {
          const dataset = await reloadBundled();
          await broadcastToTabs({ type: 'DATASET_UPDATED', dataset });
          sendResponse({ ok: true, count: (dataset.entries || []).length });
          break;
        }
        default:
          sendResponse({ ok: false, error: 'unknown type' });
      }
    } catch (e) {
      console.error('[AIML] background error', e);
      sendResponse({ ok: false, error: String(e) });
    }
  })();

  return true; // async response
});
