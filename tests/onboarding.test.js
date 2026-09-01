const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.resolve(__dirname, '../onboarding.js'), 'utf8');

describe('onboarding localization', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    document.body.innerHTML = '<h1 data-i18n="onboardingWelcome">Welcome to Blankit</h1>';
  });

  test('uses the browser locale and translated messages', () => {
    global.chrome = {
      i18n: {
        getUILanguage: () => 'it-IT',
        getMessage: (key) => key === 'onboardingWelcome' ? 'Benvenuto in Blankit' : ''
      }
    };

    eval(source);

    expect(document.documentElement.lang).toBe('it');
    expect(document.querySelector('h1').textContent).toBe('Benvenuto in Blankit');
  });

  test('keeps the English markup when Chrome i18n is unavailable', () => {
    delete global.chrome;

    eval(source);

    expect(document.documentElement.lang).toBe('en');
    expect(document.querySelector('h1').textContent).toBe('Welcome to Blankit');
  });
});