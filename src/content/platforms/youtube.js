// YouTube (www.youtube.com) platform adapter.
(function () {
  'use strict';

  const CHANNEL_RE = /\/channel\/(UC[\w-]+)/;
  const HANDLE_RE  = /\/(@[\w.\-]+)/;

  function extractFromAnchor(a) {
    const href = a.getAttribute('href') || '';
    const name = (a.textContent || '').trim();
    let m = href.match(CHANNEL_RE);
    if (m) return { type: 'artist', platformId: m[1], name };
    m = href.match(HANDLE_RE);
    if (m) return { type: 'artist', platformId: m[1], name };
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
      const info = extractFromAnchor(a);
      if (!info || !info.name) continue;
      // Skip overlay anchors (absolutely/fixed-positioned clickable regions
      // that cover thumbnails / cards). Inserting a badge afterend of these
      // produces a "floating" badge at an unrelated spot in document flow.
      const cs = a.ownerDocument.defaultView.getComputedStyle(a);
      if (cs.position === 'absolute' || cs.position === 'fixed') continue;
      out.push({ element: a, name: info.name, platformId: info.platformId, type: info.type });
    }

    // Channel page header
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
