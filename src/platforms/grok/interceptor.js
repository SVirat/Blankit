// src/platforms/grok/interceptor.js — Grok DOM/Event file upload interception
(function () {
    'use strict';

    var host = window.location.hostname;
    if (host !== 'grok.com' && host !== 'www.grok.com') return;

    var C = window.__cloaker;
    var cleanableExtensions = /\.(docx|xlsx|pptx|txt|csv|tsv|json|xml|md|log|html|htm|yaml|yml|ini|cfg|conf|rtf|pdf)$/i;

    function isCleanable(file) {
        return cleanableExtensions.test(file.name) || C.isOoxmlFile(file) || C.isTextFile(file) || C.isPdfFile(file);
    }

    async function cleanFile(file) {
        if (C.isOoxmlFile(file)) return await C.redactOoxmlFile(file);
        if (C.isPdfFile(file)) return await C.redactPdfFile(file);
        if (C.isTextFile(file)) return await C.redactTextFile(file);
        return file;
    }

    document.addEventListener('change', async function (event) {
        if (!C.enabled || event._cloakerBypass) return;

        var input = event.target;
        if (!(input instanceof HTMLInputElement) || input.type !== 'file') return;
        if (!input.files || input.files.length === 0) return;

        var files = Array.from(input.files);
        if (!files.some(isCleanable)) return;

        event.stopImmediatePropagation();

        try {
            var transfer = new DataTransfer();
            for (var i = 0; i < files.length; i++) {
                transfer.items.add(isCleanable(files[i]) ? await cleanFile(files[i]) : files[i]);
            }
            input.files = transfer.files;

            var replacementEvent = new Event('change', { bubbles: true });
            replacementEvent._cloakerBypass = true;
            input.dispatchEvent(replacementEvent);
        } catch (error) {
            console.warn('[Cloaker][Grok] File interception error:', error);
            var fallbackEvent = new Event('change', { bubbles: true });
            fallbackEvent._cloakerBypass = true;
            input.dispatchEvent(fallbackEvent);
        }
    }, true);

    document.addEventListener('drop', async function (event) {
        if (!C.enabled || event._cloakerBypass) return;
        if (!event.dataTransfer || !event.dataTransfer.files || event.dataTransfer.files.length === 0) return;

        var files = Array.from(event.dataTransfer.files);
        if (!files.some(isCleanable)) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        try {
            var transfer = new DataTransfer();
            for (var i = 0; i < files.length; i++) {
                transfer.items.add(isCleanable(files[i]) ? await cleanFile(files[i]) : files[i]);
            }

            var replacementEvent = new DragEvent('drop', { bubbles: true, cancelable: true });
            Object.defineProperty(replacementEvent, 'dataTransfer', { value: transfer });
            replacementEvent._cloakerBypass = true;
            event.target.dispatchEvent(replacementEvent);
        } catch (error) {
            console.warn('[Cloaker][Grok] Drag-and-drop error:', error);
        }
    }, true);
})();