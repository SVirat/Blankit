// src/platforms/grok/selectors.js — Grok CSS selectors
(function () {
    'use strict';
    var C = window.__cloaker;

    C.inputSelectors.push(
        'textarea[aria-label="Ask Grok anything"]',
        'textarea[placeholder="Ask Grok"]'
    );

    C.sendButtonSelectors.push(
        'button[data-testid="chat-submit"]',
        'button[aria-label="Submit"][type="submit"]'
    );
})();