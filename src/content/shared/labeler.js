// Core labeler: scans mutated DOM nodes via the active platform adapter and
// injects AI badges next to matching artist/track names.
(function () {
  'use strict';

  const { store, badge, normalize } = window.AIML;
  const PROCESSED_ATTR = 'data-aiml-processed';

  function scan(roots, platform) {
    if (!store.isEnabled() || !store.isLoaded()) return 0;
    let added = 0;
    for (const root of roots) {
      if (!root || root.nodeType !== 1) continue;
      const candidates = platform.findCandidates(root);
      for (const c of candidates) {
        if (!c.element || c.element.getAttribute(PROCESSED_ATTR) === '1') continue;
        if (!c.name && !c.platformId) continue;

        const keys = [];
        if (c.platformId) {
          keys.push(normalize.platformKey(platform.id, c.type || 'artist', c.platformId));
        }
        if (c.name) {
          keys.push('name:' + (c.type || 'artist') + ':' + normalize.normalizeName(c.name));
        }

        const entry = store.lookup(keys);
        c.element.setAttribute(PROCESSED_ATTR, '1');
        if (!entry) continue;

        // Already badged? (e.g. parent already processed)
        if (c.element.querySelector(':scope > .aiml-badge-host') ||
            (c.element.nextElementSibling && c.element.nextElementSibling.classList && c.element.nextElementSibling.classList.contains('aiml-badge-host'))) {
          continue;
        }

        const tooltip = `AI-generated${entry.notes ? ' — ' + entry.notes : ''}`;
        const b = badge.createBadge({ reason: entry.reason || 'seed', tooltip });
        const target = c.insertAfter || c.element;
        try {
          if (c.placement === 'append') {
            target.appendChild(b);
          } else {
            target.insertAdjacentElement('afterend', b);
          }
          added++;
        } catch (e) {
          // insertion target may not support the preferred placement -> append as child
          try { target.appendChild(b); added++; } catch (_) {}
        }
      }
    }
    return added;
  }

  function clearBadges() {
    document.querySelectorAll('.aiml-badge-host').forEach((n) => n.remove());
    document.querySelectorAll('[' + PROCESSED_ATTR + ']').forEach((n) => n.removeAttribute(PROCESSED_ATTR));
  }

  window.AIML.labeler = { scan, clearBadges };
})();
