const { test, expect, chromium } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const extensionPath = path.resolve(__dirname, '..', '..');

const platforms = [
  {
    name: 'ChatGPT',
    host: 'chatgpt.com',
    endpoint: '/backend-api/conversation',
    editor: '<div id="prompt-textarea" contenteditable="true"></div>',
    button: '<button data-testid="send-button">Send</button>',
    sendSelector: 'button[data-testid="send-button"]',
    editorSelector: '#prompt-textarea',
    uploadRead: 'text',
  },
  {
    name: 'Claude',
    host: 'claude.ai',
    endpoint: '/api/append_message',
    editor: '<div class="ProseMirror" contenteditable="true"></div>',
    button: '<button aria-label="Send message">Send</button>',
    sendSelector: 'button[aria-label="Send message"]',
    editorSelector: 'div.ProseMirror',
    uploadRead: 'text',
  },
  {
    name: 'Gemini',
    host: 'gemini.google.com',
    endpoint: '/api/generate',
    editor: '<div class="ql-editor" contenteditable="true" role="textbox"></div>',
    button: '<button aria-label="Send message">Send</button>',
    sendSelector: 'button[aria-label="Send message"]',
    editorSelector: 'div.ql-editor',
    uploadRead: 'arrayBuffer',
  },
  {
    name: 'Grok',
    host: 'grok.com',
    endpoint: '/rest/app-chat/conversations/new',
    editor: '<textarea placeholder="Ask Grok" aria-label="Ask Grok anything"></textarea>',
    button: '<button type="submit" aria-label="Submit" data-testid="chat-submit">Send</button>',
    sendSelector: 'button[data-testid="chat-submit"]',
    editorSelector: 'textarea[aria-label="Ask Grok anything"]',
    uploadRead: 'text',
  },
  {
    name: 'Perplexity',
    host: 'www.perplexity.ai',
    endpoint: '/rest/sse/perplexity_ask',
    editor: '<div id="ask-input" contenteditable="true" role="textbox" data-lexical-editor="true"></div>',
    button: '<button type="button" aria-label="Submit">Send</button>',
    sendSelector: 'button[aria-label="Submit"]',
    editorSelector: '#ask-input',
    uploadRead: 'text',
  },
];

function fixtureHtml(platform, theme = 'light') {
  const background = theme === 'dark' ? '#111827' : '#ffffff';
  const foreground = theme === 'dark' ? '#f3f4f6' : '#111827';
  return `<!doctype html>
    <html class="${theme}">
      <body style="background:${background};color:${foreground}">
        ${platform.editor}
        ${platform.button}
        <input id="file-upload" type="file">
        <script>
          const editor = document.querySelector('textarea, [contenteditable="true"]');
          document.querySelector('button').addEventListener('click', () => {
            fetch('${platform.endpoint}', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ message: editor.value || editor.innerText })
            });
          });
          const fileInput = document.querySelector('#file-upload');
          if (fileInput) {
            fileInput.addEventListener('change', async () => {
              const file = fileInput.files[0];
              if ('${platform.uploadRead}' === 'arrayBuffer') {
                window.uploadedText = new TextDecoder().decode(await file.arrayBuffer());
              } else {
                window.uploadedText = await file.text();
              }
            });
          }
        </script>
      </body>
    </html>`;
}

test.describe('production extension interception', () => {
  let context;
  let extensionId;
  let userDataDir;

  test.beforeAll(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blankit-e2e-'));
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: true,
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    const serviceWorker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    extensionId = new URL(serviceWorker.url()).host;
  });

  test.afterAll(async () => {
    if (context) await context.close();
    if (userDataDir) fs.rmSync(userDataDir, { recursive: true, force: true });
  });

  for (const platform of platforms) {
    test(`${platform.name} redacts a prompt before fetch`, async () => {
      const page = await context.newPage();
      await page.route(`https://${platform.host}/**`, async (route) => {
        if (route.request().resourceType() === 'document') {
          await route.fulfill({ contentType: 'text/html', body: fixtureHtml(platform) });
        } else {
          await route.fulfill({ contentType: 'application/json', body: '{}' });
        }
      });

      await page.goto(`https://${platform.host}/`);
      await expect(page.locator('#cloaker-badge')).toBeVisible();
      await expect(page.locator('#cloaker-unredact-btn')).toHaveText('\u{1F441}\uFE0F');
      await page.locator(platform.editorSelector).fill('Contact jane@example.com for access.');

      const requestPromise = page.waitForRequest((request) =>
        request.url().includes(platform.endpoint) && request.method() === 'POST'
      );
      await page.locator(platform.sendSelector).click();
      const request = await requestPromise;
      const payload = request.postDataJSON();

      expect(payload.message).toMatch(/Contact \[EMAIL_\d+\] for access\./);
      expect(payload.message).not.toContain('jane@example.com');
      await page.close();
    });
  }

  for (const platform of platforms) {
    test(`${platform.name} replaces an uploaded text file before the page reads it`, async () => {
      const page = await context.newPage();
      await page.route(`https://${platform.host}/**`, async (route) => {
        await route.fulfill({ contentType: 'text/html', body: fixtureHtml(platform) });
      });

      await page.goto(`https://${platform.host}/`);
      await expect(page.locator('#cloaker-badge')).toBeVisible();
      await page.locator('#file-upload').setInputFiles({
        name: 'contacts.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Email: jane@example.com'),
      });

      await page.waitForFunction(() => typeof window.uploadedText === 'string');
      const uploadedText = await page.evaluate(() => window.uploadedText);
      expect(uploadedText).toMatch(/Email: \[EMAIL_\d+\]/);
      expect(uploadedText).not.toContain('jane@example.com');
      await expect(page.locator('.cloaker-scrub-msg')).toHaveCSS('color', 'rgb(37, 99, 235)');
      await page.close();
    });

    test(`${platform.name} controls follow site theme and use blue accents`, async () => {
      const page = await context.newPage();
      await page.route(`https://${platform.host}/**`, async (route) => {
        await route.fulfill({ contentType: 'text/html', body: fixtureHtml(platform, 'dark') });
      });

      await page.goto(`https://${platform.host}/`);
      const badge = page.locator('#cloaker-badge');
      await expect(badge).toHaveAttribute('data-cloaker-theme', 'dark');
      await expect(badge).toHaveCSS('border-color', 'rgb(59, 130, 246)');

      await page.evaluate(() => {
        document.documentElement.className = 'light';
        document.body.style.background = '#ffffff';
      });
      await expect(badge).toHaveAttribute('data-cloaker-theme', 'light');
      await expect(badge).toHaveCSS('border-color', 'rgb(37, 99, 235)');
      await page.close();
    });
  }

  test('Gemini preserves configured XHR state when correcting upload metadata', async () => {
    const platform = platforms.find((item) => item.name === 'Gemini');
    const page = await context.newPage();
    await page.route(`https://${platform.host}/**`, async (route) => {
      await route.fulfill({ contentType: 'text/html', body: fixtureHtml(platform) });
    });
    await page.route('https://push.clients6.google.com/**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': `https://${platform.host}` },
        body: '{}',
      });
    });

    await page.goto(`https://${platform.host}/`);
    const originalContent = 'Email: jane@example.com';
    await page.locator('#file-upload').setInputFiles({
      name: 'jane@example.com.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(originalContent),
    });
    await page.waitForFunction(() => typeof window.uploadedText === 'string');

    const requestPromise = page.waitForRequest((request) =>
      request.url().startsWith('https://push.clients6.google.com/upload/') && request.method() === 'POST'
    );
    const result = await page.evaluate(async (declaredSize) => {
      const C = window.__cloaker;
      let reopenCount = 0;
      C._origXHROpen = function () { reopenCount++; };
      const cleanedFile = document.querySelector('#file-upload').files[0];

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://push.clients6.google.com/upload/', true);
      xhr.withCredentials = true;
      xhr.responseType = 'json';
      xhr.setRequestHeader('x-goog-upload-header-content-length', String(declaredSize));
      xhr.setRequestHeader('x-goog-upload-file-name', 'jane@example.com.txt');
      xhr.send('{}');

      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        reopenCount,
        withCredentials: xhr.withCredentials,
        responseType: xhr.responseType,
        cleanedSize: cleanedFile.size,
        cleanedName: cleanedFile.name,
      };
    }, Buffer.byteLength(originalContent));
    const request = await requestPromise;

    expect(result.reopenCount).toBe(0);
    expect(result.withCredentials).toBe(true);
    expect(result.responseType).toBe('json');
    expect(request.headers()['x-goog-upload-header-content-length']).toBe(String(result.cleanedSize));
    expect(request.headers()['x-goog-upload-file-name']).toBe(encodeURIComponent(result.cleanedName));
    await page.close();
  });

  test('popup switches use blue accents when enabled in both themes', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    const toggle = page.locator('#master-toggle');
    const slider = toggle.locator('+ .slider');

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await toggle.evaluate((element) => { element.checked = true; });
    await expect(slider).toHaveCSS('background-color', 'rgb(37, 99, 235)');
    await toggle.evaluate((element) => { element.checked = false; });
    await expect(slider).toHaveCSS('background-color', 'rgb(197, 206, 217)');

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await toggle.evaluate((element) => { element.checked = true; });
    await expect(slider).toHaveCSS('background-color', 'rgb(59, 130, 246)');
    await page.close();
  });

  test('popup displays detection categories in two columns without overflow', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const layout = await page.locator('.category-list').evaluate((list) => {
      const items = Array.from(list.querySelectorAll('.category-item'));
      return {
        columns: getComputedStyle(list).gridTemplateColumns.split(' ').length,
        overflowingItems: items.filter((item) => item.scrollWidth > item.clientWidth).length,
      };
    });

    expect(layout.columns).toBe(2);
    expect(layout.overflowingItems).toBe(0);
    await page.close();
  });
});