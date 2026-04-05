// Global namespace for the extension's content-script modules.
// All shared modules attach to window.AIML.
(function () {
  'use strict';
  if (window.AIML) return;
  window.AIML = {
    config: {
      version: '0.1.0',
      badgeText: 'AI',
      badgeColor: '#7c3aed',
      debugLog: false,
    },
  };
})();
