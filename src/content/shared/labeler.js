// Core labeler: scans mutated DOM nodes via the active platform adapter and
// injects AI badges next to matching artist/track names.
(function () {
  'use strict';

  const { store, badge, normalize } = window.AIML;
  const PROCESSED_ATTR = 'data-aiml-processed';
  const BADGED_ATTR = 'data-aiml-badged';

  function scan(roots, platform) {
    if (!store.isEnabled() || !store.isLoaded()) return 0;
    let added = 0;
    for (const root of roots) {
      if (!root || root.nodeType !== 1) continue;
      const candidates = platform.findCandidates(root);
      for (const c of candidates) {
        if (!c.element || c.element.getAttribute(PROCESSED_ATTR) === '1') continue;
        if (c.element.getAttribute(BADGED_ATTR) === '1') continue;
        if (!c.name && !c.platformId) continue;

        const keys = [];
        if (c.platformId) {
          keys.push(normalize.platformKey(platform.id, c.type || 'artist', c.platformId));
        } else if (c.name) {
          // Name-based matching is only safe when we have no authoritative ID
          // (avoids false positives from artist namesakes on the same platform).
          keys.push('name:' + (c.type || 'artist') + ':' + normalize.normalizeName(c.name));
        }

        const entry = store.lookup(keys);
        c.element.setAttribute(PROCESSED_ATTR, '1');
        if (!entry) continue;

        const target = c.insertAfter || c.element;

        // Already badged? (e.g. parent already processed or prior scan)
        if (target.getAttribute && target.getAttribute(BADGED_ATTR) === '1') continue;
        if (c.element.querySelector(':scope > .aiml-badge-host') ||
            (c.element.nextElementSibling && c.element.nextElementSibling.classList && c.element.nextElementSibling.classList.contains('aiml-badge-host'))) {
          if (target.setAttribute) target.setAttribute(BADGED_ATTR, '1');
          c.element.setAttribute(BADGED_ATTR, '1');
          continue;
        }

        const tooltip = `AI-generated${entry.notes ? ' — ' + entry.notes : ''}`;
        const b = badge.createBadge({ reason: entry.reason || 'seed', tooltip });
        try {
          if (c.placement === 'append') {
            target.appendChild(b);
          } else {
            target.insertAdjacentElement('afterend', b);
          }
          if (target.setAttribute) target.setAttribute(BADGED_ATTR, '1');
          c.element.setAttribute(BADGED_ATTR, '1');
          added++;
        } catch (e) {
          // insertion target may not support the preferred placement -> append as child
          try {
            target.appendChild(b);
            if (target.setAttribute) target.setAttribute(BADGED_ATTR, '1');
            c.element.setAttribute(BADGED_ATTR, '1');
            added++;
          } catch (_) {}
        }
      }
    }
    return added;
  }

  function clearBadges() {
    document.querySelectorAll('.aiml-badge-host').forEach((n) => n.remove());
    document.querySelectorAll('[' + PROCESSED_ATTR + ']').forEach((n) => n.removeAttribute(PROCESSED_ATTR));
    document.querySelectorAll('[' + BADGED_ATTR + ']').forEach((n) => n.removeAttribute(BADGED_ATTR));
  }

  window.AIML.labeler = { scan, clearBadges };
})();
