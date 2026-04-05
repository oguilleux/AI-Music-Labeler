// Creates the "AI" badge as a Shadow DOM host element for full CSS isolation.
(function () {
  'use strict';

  const { config } = window.AIML;

  function createBadge({ reason = 'seed', tooltip = '' } = {}) {
    const host = document.createElement('span');
    host.className = 'aiml-badge-host';
    host.setAttribute('data-aiml', '1');
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', tooltip || 'AI-generated');
    host.style.display = 'inline-block';

    const shadow = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: inline-flex;
        vertical-align: middle;
        margin-left: 4px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
        pointer-events: auto;
      }
      .b {
        background: ${config.badgeColor};
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        line-height: 1;
        padding: 2px 5px;
        border-radius: 3px;
        letter-spacing: 0.3px;
        cursor: help;
        user-select: none;
        white-space: nowrap;
      }
      .b[data-reason="reported"] { background: #dc2626; }
    `;
    const span = document.createElement('span');
    span.className = 'b';
    span.setAttribute('data-reason', reason);
    span.title = tooltip || 'AI-generated';
    span.textContent = config.badgeText;

    shadow.appendChild(style);
    shadow.appendChild(span);
    return host;
  }

  window.AIML.badge = { createBadge };
})();
