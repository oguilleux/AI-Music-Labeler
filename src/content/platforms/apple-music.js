// Apple Music web (music.apple.com) platform adapter.
(function () {
  'use strict';

  // URLs: /{country}/artist/{slug}/{id}  or  /{country}/song/{slug}/{id}
  const ARTIST_RE = /\/artist\/[^/]+\/(\d+)/;
  const SONG_RE   = /\/song\/[^/]+\/(\d+)/;

  function extractFromAnchor(a) {
    const href = a.getAttribute('href') || '';
    const name = (a.textContent || '').trim();
    let m = href.match(ARTIST_RE);
    if (m) return { type: 'artist', platformId: m[1], name };
    m = href.match(SONG_RE);
    if (m) return { type: 'track', platformId: m[1], name };
    return null;
  }

  function findCandidates(root) {
    const out = [];
    if (!root.querySelectorAll) return out;

    const anchors = root.querySelectorAll(
      'a[href*="/artist/"], a[href*="/song/"]'
    );
    for (const a of anchors) {
      const info = extractFromAnchor(a);
      if (!info || !info.name) continue;
      out.push({ element: a, name: info.name, platformId: info.platformId, type: info.type });
    }

    // Artist page title
    const headers = root.querySelectorAll('.headings__title, .product-header__title, h1');
    for (const h of headers) {
      const name = (h.textContent || '').trim();
      if (!name || name.length > 120) continue;
      // Only on /artist/ URL
      const m = location.pathname.match(ARTIST_RE);
      if (!m) continue;
      out.push({ element: h, name, platformId: m[1], type: 'artist' });
    }

    return out;
  }

  window.AIML.platforms = window.AIML.platforms || {};
  window.AIML.platforms.applemusic = {
    id: 'applemusic',
    host: 'music.apple.com',
    findCandidates,
  };
})();
