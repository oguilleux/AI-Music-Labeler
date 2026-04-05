// YouTube (www.youtube.com) platform adapter.
(function () {
  'use strict';

  const CHANNEL_RE = /\/channel\/(UC[\w-]+)/;
  const HANDLE_RE  = /\/(@[\w.\-]+)/;

  function extractIdFromHref(href) {
    let m = href.match(CHANNEL_RE);
    if (m) return m[1];
    m = href.match(HANDLE_RE);
    if (m) return m[1];
    return null;
  }

  function findCandidates(root) {
    const out = [];
    if (!root.querySelectorAll) return out;

    // Channel/handle links in recos, comments, video metadata.
    const anchors = root.querySelectorAll(
      'a[href*="/channel/"], a[href*="/@"]'
    );
    for (const a of anchors) {
      const href = a.getAttribute('href') || '';
      const platformId = extractIdFromHref(href);
      if (!platformId) continue;

      // Skip overlay anchors (absolutely/fixed-positioned clickable regions
      // that cover thumbnails / cards).
      const cs = a.ownerDocument.defaultView.getComputedStyle(a);
      if (cs.position === 'absolute' || cs.position === 'fixed') continue;

      // If this anchor wraps a channel-name block (search result card,
      // watch card header, etc.), retarget the badge to that inner element
      // so it renders next to the name instead of after the whole block.
      const nameEl = a.querySelector(
        'ytd-channel-name #text, #channel-title #text, #channel-name #text'
      );
      if (nameEl) {
        const name = (nameEl.textContent || '').trim();
        if (!name) continue;
        out.push({ element: nameEl, name, platformId, type: 'artist', placement: 'append' });
        continue;
      }

      // Plain inline text anchor (e.g. byline link under a video).
      const name = (a.textContent || '').trim();
      if (!name) continue;
      out.push({ element: a, name, platformId, type: 'artist' });
    }

    // Channel page header (standalone, not inside an anchor).
    const channelTitles = root.querySelectorAll(
      'ytd-channel-name #text, yt-dynamic-text-view-model h1, #channel-name #text'
    );
    for (const h of channelTitles) {
      const name = (h.textContent || '').trim();
      if (!name) continue;
      out.push({ element: h, name, platformId: null, type: 'artist', placement: 'append' });
    }

    return out;
  }

  window.AIML.platforms = window.AIML.platforms || {};
  window.AIML.platforms.youtube = {
    id: 'youtube',
    host: 'www.youtube.com',
    findCandidates,
  };
})();
