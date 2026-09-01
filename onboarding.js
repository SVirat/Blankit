// onboarding.js — Localize the welcome page using Chrome's active locale.
(function () {
    'use strict';

    function message(key) {
        try {
            return chrome.i18n.getMessage(key) || '';
        } catch (error) {
            return '';
        }
    }

    try {
        var language = chrome.i18n.getUILanguage();
        if (language) document.documentElement.lang = language.split('-')[0].toLowerCase();
    } catch (error) {
        document.documentElement.lang = 'en';
    }

    document.querySelectorAll('[data-i18n]').forEach(function (element) {
        var translated = message(element.getAttribute('data-i18n'));
        if (translated) element.textContent = translated;
    });

    document.querySelectorAll('[data-i18n-brand]').forEach(function (element) {
        var translated = message(element.getAttribute('data-i18n-brand'));
        if (!translated) return;

        var brandIndex = translated.indexOf('Blankit');
        if (brandIndex < 0) {
            element.textContent = translated;
            return;
        }

        element.textContent = '';
        element.appendChild(document.createTextNode(translated.slice(0, brandIndex)));
        var brand = document.createElement('span');
        brand.className = 'gradient-text';
        brand.textContent = 'Blankit';
        element.appendChild(brand);
        element.appendChild(document.createTextNode(translated.slice(brandIndex + 7)));
    });
})();