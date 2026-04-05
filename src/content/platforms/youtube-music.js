// YouTube Music (music.youtube.com) platform adapter.
(function () {
  'use strict';

  // YTM uses channel URLs for artists; browse IDs can appear in href too.
  const CHANNEL_RE = /channel\/(UC[\w-]+)/;
  const BROWSE_RE  = /browse\/(MPREb_[\w-]+|MPLA[\w-]+|UC[\w-]+)/;

  function extractFromAnchor(a) {
    const href = a.getAttribute('href') || '';
    const name = (a.textContent || '').trim();
    let m = href.match(CHANNEL_RE);
    if (m) return { type: 'artist', platformId: m[1], name };
    m = href.match(BROWSE_RE);
    if (m) {
      // MPREb = album; UC = artist; assume artist if UC-prefixed
      const type = m[1].startsWith('UC') ? 'artist' : 'artist';
      return { type, platformId: m[1], name };
    }
    return null;
  }

  function findCandidates(root) {
    const out = [];
    if (!root.querySelectorAll) return out;

    // Artist/channel links inside rows, cards, shelves.
    const anchors = root.querySelectorAll(
      'a[href*="channel/"], a[href*="browse/UC"]'
    );
    for (const a of anchors) {
      // Skip anchors that are shelf/section header links (text is a label like
      // "Vidéos", "Albums"…, not the artist name).
      if (a.closest('[role="heading"], ytmusic-carousel-shelf-basic-header-renderer, ytmusic-shelf-renderer > .header')) continue;
      const info = extractFromAnchor(a);
      if (!info || !info.name) continue;
      out.push({ element: a, name: info.name, platformId: info.platformId, type: info.type });
    }

    // Artist/channel page header (immersive, detail, visual, channel variants)
    const headers = root.querySelectorAll(
      'ytmusic-immersive-header-renderer .title, ' +
      'ytmusic-detail-header-renderer .title, ' +
      'ytmusic-visual-header-renderer .title, ' +
      'ytmusic-header-renderer .title, ' +
      'ytmusic-channel-header-renderer .title'
    );
    for (const h of headers) {
      const name = (h.textContent || '').trim();
      if (!name) continue;
      out.push({ element: h, name, platformId: null, type: 'artist', placement: 'append' });
    }

    return out;
  }

  window.AIML.platforms = window.AIML.platforms || {};
  window.AIML.platforms.ytmusic = {
    id: 'ytmusic',
    host: 'music.youtube.com',
    findCandidates,
  };
})();
