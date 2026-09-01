// src/platforms/perplexity/selectors.js — Perplexity CSS selectors
(function () {
    'use strict';
    var C = window.__cloaker;

    C.inputSelectors.push(
        '#ask-input[contenteditable="true"]',
        'div[data-lexical-editor="true"][role="textbox"]'
    );

    C.sendButtonSelectors.push(
        'button[aria-label="Submit"]'
    );
})();