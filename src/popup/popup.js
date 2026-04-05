const $ = (sel) => document.querySelector(sel);

function fmtDate(ts) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString(); } catch { return '—'; }
}

async function send(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (res) => {
      if (chrome.runtime.lastError) resolve({ ok: false, error: chrome.runtime.lastError.message });
      else resolve(res);
    });
  });
}

async function refresh() {
  const stats = await send({ type: 'GET_STATS' });
  if (!stats) return;
  $('#count').textContent = stats.count ?? '—';
  $('#version').textContent = stats.version ?? '—';
  $('#updated').textContent = stats.updated ?? '—';
  $('#toggle-enabled').checked = !!stats.enabled;
}

document.addEventListener('DOMContentLoaded', () => {
  refresh();

  $('#toggle-enabled').addEventListener('change', async (e) => {
    await send({ type: 'SET_ENABLED', enabled: e.target.checked });
  });

  $('#reload-btn').addEventListener('click', async () => {
    $('#reload-btn').disabled = true;
    $('#reload-btn').textContent = 'Reloading…';
    const res = await send({ type: 'RELOAD_DATASET' });
    $('#reload-btn').disabled = false;
    $('#reload-btn').textContent = res && res.ok ? `Reloaded (${res.count})` : 'Reload failed';
    setTimeout(() => ($('#reload-btn').textContent = 'Reload bundled database'), 1500);
    refresh();
  });
});
