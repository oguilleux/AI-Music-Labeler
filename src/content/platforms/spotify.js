// Spotify web (open.spotify.com) platform adapter.
(function () {
  'use strict';

  const ARTIST_HREF_RE = /\/artist\/([A-Za-z0-9]+)/;
  const TRACK_HREF_RE  = /\/track\/([A-Za-z0-9]+)/;
  // Spotify embeds URIs like "spotify:artist:<ID>" in data-testid attributes on
  // cards (e.g. "card-title-spotify:artist:0sIHITimEaT4w5GwOzliVK-12").
  const URI_RE = /spotify:(artist|track):([A-Za-z0-9]+)/;

  function extractFromAnchor(a) {
    const href = a.getAttribute('href') || '';
    let m = href.match(ARTIST_HREF_RE);
    if (m) return { type: 'artist', platformId: m[1], name: (a.textContent || '').trim() };
    m = href.match(TRACK_HREF_RE);
    if (m) return { type: 'track', platformId: m[1], name: (a.textContent || '').trim() };
    return null;
  }

  function findCandidates(root) {
    const out = [];

    // Anchors pointing to artists or tracks (covers search, playlists, album pages, rows).
    const anchors = root.querySelectorAll
      ? root.querySelectorAll('a[href*="/artist/"], a[href*="/track/"]')
      : [];
    for (const a of anchors) {
      const info = extractFromAnchor(a);
      if (!info) continue;
      if (!info.name) continue;
      out.push({ element: a, name: info.name, platformId: info.platformId, type: info.type });
    }

    // Artist page big header: <h1> inside a section with data-testid="artist-page"
    // and now-playing widget's artist name.
    const headers = root.querySelectorAll
      ? root.querySelectorAll('[data-testid="artist-page"] h1, [data-testid="entityTitle"] h1')
      : [];
    for (const h of headers) {
      const name = (h.textContent || '').trim();
      if (!name) continue;
      // Try to read an artist ID from the URL for extra precision.
      let platformId = null;
      const m = location.pathname.match(ARTIST_HREF_RE);
      if (m) platformId = m[1];
      out.push({ element: h, name, platformId, type: 'artist', placement: 'append' });
    }

    // Elements with Spotify URIs embedded in data-testid (search cards, row
    // actions, etc.). These are the most reliable ID source — use them even
    // when the wrapping anchor is missing or handled separately.
    const uriNodes = root.querySelectorAll
      ? root.querySelectorAll('[data-testid*="spotify:artist:"], [data-testid*="spotify:track:"]')
      : [];
    for (const el of uriNodes) {
      const testid = el.getAttribute('data-testid') || '';
      const m = testid.match(URI_RE);
      if (!m) continue;
      // Only badge the visible title element, not subtitles/duplicates, to
      // avoid stacking multiple badges on the same card.
      if (!/^card-title-/.test(testid) && !/^tracklist-row-/.test(testid) && !/^herolink-/.test(testid)) continue;
      const name = (el.textContent || '').trim();
      out.push({ element: el, name, platformId: m[2], type: m[1], placement: 'append' });
    }

    // Fallback: if we're on an artist page but the structured headers above
    // didn't match (Spotify DOM changes), badge the first <main> h1 using
    // the ID from the URL.
    const pathMatch = location.pathname.match(ARTIST_HREF_RE);
    if (pathMatch) {
      const h1 = root.querySelector ? root.querySelector('main h1') : null;
      if (h1 && (h1.textContent || '').trim()) {
        out.push({ element: h1, name: h1.textContent.trim(), platformId: pathMatch[1], type: 'artist', placement: 'append' });
      }
    }

    return out;
  }

  window.AIML.platforms = window.AIML.platforms || {};
  window.AIML.platforms.spotify = {
    id: 'spotify',
    host: 'open.spotify.com',
    findCandidates,
  };
})();
