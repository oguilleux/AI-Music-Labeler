// Normalizes artist/track names for cross-platform matching.
(function () {
  'use strict';

  function normalizeName(s) {
    if (!s) return '';
    return s
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')   // strip diacritics
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')          // punctuation -> space
      .replace(/\s+/g, ' ')
      .trim();
  }

  function nameKey(s) {
    return 'name:' + normalizeName(s);
  }

  function platformKey(platform, type, id) {
    return `${platform}:${type}:${id}`;
  }

  window.AIML.normalize = { normalizeName, nameKey, platformKey };
})();
