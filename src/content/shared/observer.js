// Debounced MutationObserver wrapper + SPA navigation detection.
(function () {
  'use strict';

  function startObserver(root, onBatch) {
    const pending = new Set();
    let scheduled = false;

    const flush = () => {
      scheduled = false;
      if (pending.size === 0) return;
      const nodes = Array.from(pending);
      pending.clear();
      try { onBatch(nodes); } catch (e) { console.warn('[AIML] batch error', e); }
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 50));
      idle(flush, { timeout: 300 });
    };

    const mo = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === 'childList') {
          r.addedNodes.forEach((n) => {
            if (n.nodeType === 1) pending.add(n);
          });
        } else if (r.type === 'attributes' && r.target.nodeType === 1) {
          pending.add(r.target);
        }
      }
      schedule();
    });

    mo.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'aria-label', 'title'],
    });

    // Initial full-scan.
    pending.add(root);
    schedule();

    return { stop: () => mo.disconnect(), forceScan: () => { pending.add(root); schedule(); } };
  }

  // SPA navigation: monkey-patch history + listen to popstate.
  function onUrlChange(callback) {
    let lastUrl = location.href;
    const fire = () => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        try { callback(location.href); } catch (e) { console.warn('[AIML] url handler error', e); }
      }
    };
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function () { const r = origPush.apply(this, arguments); fire(); return r; };
    history.replaceState = function () { const r = origReplace.apply(this, arguments); fire(); return r; };
    window.addEventListener('popstate', fire);
    window.addEventListener('hashchange', fire);
  }

  window.AIML.observer = { startObserver, onUrlChange };
})();
