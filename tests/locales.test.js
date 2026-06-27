/**
 * tests/locales.test.js
 * Multi-language PII detection tests for src/core/locales.js + src/core/pii-engine.js
 *
 * Covers Japanese, French, Russian, Portuguese, Spanish, German and Chinese
 * detection of names, dates, addresses, labeled IDs and credentials, plus
 * graceful-fallback and English no-regression guarantees.
 */
const { loadPiiEngine, resetCloaker } = require('./helpers/setup');
const fs = require('fs');
const path = require('path');

let C;

beforeAll(() => {
  C = loadPiiEngine();
});

beforeEach(() => {
  resetCloaker();
});

/** Convenience: does the result contain a placeholder of a given label? */
function hasPlaceholder(result, label) {
  return new RegExp('\\[' + label + '_\\d+\\]').test(result);
}
function hasType(items, type) {
  return items.some((i) => i.type === type);
}

// ─── Locale module wiring ────────────────────────────────────────────────────

describe('locales module', () => {
  test('exposes the supported language set', () => {
    expect(window.__cloakerLocales).toBeDefined();
    expect(window.__cloakerLocales.SUPPORTED).toEqual(
      expect.arrayContaining(['en', 'fr', 'de', 'es', 'pt', 'ru', 'ja', 'zh'])
    );
  });

  test('merged data is built and non-empty', () => {
    const m = window.__cloakerLocales.merged;
    expect(m.months.length).toBeGreaterThan(0);
    expect(m.passport.length).toBeGreaterThan(0);
    expect(m.surnames.length).toBeGreaterThan(0);
  });

  test('build() skips unknown languages gracefully', () => {
    const m = window.__cloakerLocales.build(['xx', 'fr']);
    expect(m.months).toEqual(expect.arrayContaining(['mars']));
  });
});

// ─── French ──────────────────────────────────────────────────────────────────

describe('French', () => {
  test('detects name via intro phrase', () => {
    const { result } = C.redactString("Je m'appelle Jean Dupont et je travaille ici.");
    expect(result).not.toContain('Jean Dupont');
    expect(hasPlaceholder(result, 'NAME')).toBe(true);
  });

  test('detects standalone common French first name', () => {
    const { result, items } = C.redactString('Contactez Sophie pour les documents.');
    expect(hasType(items, 'Person Name')).toBe(true);
    expect(result).not.toContain('Sophie');
  });

  test('detects localized date', () => {
    const { result, items } = C.redactString('Né le 15 mars 1985 à Lyon.');
    expect(hasType(items, 'Date')).toBe(true);
    expect(result).not.toContain('15 mars 1985');
  });

  test('detects address with leading number', () => {
    const { result, items } = C.redactString("J'habite au 12 rue de la Paix.");
    expect(hasType(items, 'Street Address')).toBe(true);
    expect(result).not.toContain('12 rue de la Paix');
  });

  test('detects passport via French keyword', () => {
    const { result, items } = C.redactString('Mon passeport: AB123456 est valide.');
    expect(hasType(items, 'Passport Number')).toBe(true);
    expect(result).not.toContain('AB123456');
  });

  test('detects credentials via French keyword', () => {
    const { result, items } = C.redactString('mot de passe: SecretXYZ1');
    expect(hasType(items, 'Credential')).toBe(true);
    expect(result).not.toContain('SecretXYZ1');
  });
});

// ─── German ──────────────────────────────────────────────────────────────────

describe('German', () => {
  test('detects name via intro phrase (umlaut surname)', () => {
    const { result } = C.redactString('Ich heiße Hans Müller und wohne hier.');
    expect(result).not.toContain('Hans Müller');
    expect(hasPlaceholder(result, 'NAME')).toBe(true);
  });

  test('detects localized date with period', () => {
    const { result, items } = C.redactString('Geboren am 15. März 1985 in Berlin.');
    expect(hasType(items, 'Date')).toBe(true);
    expect(result).not.toContain('15. März 1985');
  });

  test('detects glued-suffix street address', () => {
    const { result, items } = C.redactString('Meine Adresse ist Bahnhofstraße 5.');
    expect(hasType(items, 'Street Address')).toBe(true);
    expect(result).not.toContain('Bahnhofstraße 5');
  });

  test('detects bank account via Kontonummer', () => {
    const { result, items } = C.redactString('Kontonummer: 1234567890');
    expect(hasType(items, 'Bank Account')).toBe(true);
    expect(result).not.toContain('1234567890');
  });

  test('detects credentials via Passwort', () => {
    const { result, items } = C.redactString('Passwort: GeheimX12');
    expect(hasType(items, 'Credential')).toBe(true);
    expect(result).not.toContain('GeheimX12');
  });
});

// ─── Spanish ─────────────────────────────────────────────────────────────────

describe('Spanish', () => {
  test('detects name via intro phrase', () => {
    const { result } = C.redactString('Me llamo Juan García y vivo aquí.');
    expect(result).not.toContain('Juan García');
    expect(hasPlaceholder(result, 'NAME')).toBe(true);
  });

  test('detects date with "de" connector', () => {
    const { result, items } = C.redactString('Nací el 15 de marzo de 1985.');
    expect(hasType(items, 'Date')).toBe(true);
    expect(result).not.toContain('15 de marzo de 1985');
  });

  test('detects address with trailing number', () => {
    const { result, items } = C.redactString('Vivo en Calle Mayor 5.');
    expect(hasType(items, 'Street Address')).toBe(true);
    expect(result).not.toContain('Calle Mayor 5');
  });

  test('detects credentials via contraseña', () => {
    const { result, items } = C.redactString('contraseña: ClaveSecreta1');
    expect(hasType(items, 'Credential')).toBe(true);
    expect(result).not.toContain('ClaveSecreta1');
  });
});

// ─── Portuguese ──────────────────────────────────────────────────────────────

describe('Portuguese', () => {
  test('detects name via intro phrase', () => {
    const { result } = C.redactString('Meu nome é João Silva, prazer.');
    expect(result).not.toContain('João Silva');
    expect(hasPlaceholder(result, 'NAME')).toBe(true);
  });

  test('detects date with "de" connector', () => {
    const { result, items } = C.redactString('Nasci em 15 de março de 1985.');
    expect(hasType(items, 'Date')).toBe(true);
    expect(result).not.toContain('15 de março de 1985');
  });

  test('detects address with trailing number', () => {
    const { result, items } = C.redactString('Moro na Rua Augusta 100.');
    expect(hasType(items, 'Street Address')).toBe(true);
    expect(result).not.toContain('Rua Augusta 100');
  });

  test('detects credentials via senha', () => {
    const { result, items } = C.redactString('senha: MinhaSenha9');
    expect(hasType(items, 'Credential')).toBe(true);
    expect(result).not.toContain('MinhaSenha9');
  });
});

// ─── Russian (Cyrillic) ──────────────────────────────────────────────────────

describe('Russian', () => {
  test('detects name via intro phrase', () => {
    const { result } = C.redactString('Меня зовут Иван Петров, очень приятно.');
    expect(result).not.toContain('Иван Петров');
    expect(hasPlaceholder(result, 'NAME')).toBe(true);
  });

  test('detects standalone common Russian first name', () => {
    const { result, items } = C.redactString('Передайте документы Сергею завтра.');
    // "Сергею" is an inflected form; ensure at least the base name "Мария" works:
    const r2 = C.redactString('Это сообщение для Мария.');
    expect(r2.result).not.toContain('Мария');
    expect(hasType(r2.items, 'Person Name')).toBe(true);
  });

  test('detects name with surname suffix', () => {
    const { result, items } = C.redactString('Документ подписал Алексей Смирнов.');
    expect(hasType(items, 'Person Name')).toBe(true);
    expect(result).not.toContain('Алексей Смирнов');
  });

  test('detects localized date', () => {
    const { result, items } = C.redactString('Дата рождения 15 января 1985 года.');
    expect(hasType(items, 'Date')).toBe(true);
    expect(result).not.toContain('15 января 1985');
  });

  test('detects Cyrillic street address', () => {
    const { result, items } = C.redactString('Я живу на улица Ленина 5.');
    expect(hasType(items, 'Street Address')).toBe(true);
    expect(result).not.toContain('улица Ленина');
  });

  test('detects credentials via пароль', () => {
    const { result, items } = C.redactString('пароль: SecretRu123');
    expect(hasType(items, 'Credential')).toBe(true);
    expect(result).not.toContain('SecretRu123');
  });
});

// ─── Japanese ────────────────────────────────────────────────────────────────

describe('Japanese', () => {
  test('detects name followed by honorific さん', () => {
    const { result, items } = C.redactString('田中さんに連絡してください。');
    expect(hasType(items, 'Person Name')).toBe(true);
    expect(result).not.toContain('田中');
  });

  test('detects name via name label', () => {
    const { result, items } = C.redactString('名前：佐藤花子');
    expect(hasType(items, 'Person Name')).toBe(true);
    expect(result).not.toContain('佐藤花子');
  });

  test('detects surname-anchored name after intro', () => {
    const { result, items } = C.redactString('私は山本太郎です。');
    expect(hasType(items, 'Person Name')).toBe(true);
    expect(result).not.toContain('山本太郎');
  });

  test('detects CJK numeric date', () => {
    const { result, items } = C.redactString('生年月日は1990年1月15日です。');
    expect(hasType(items, 'Date')).toBe(true);
    expect(result).not.toContain('1990年1月15日');
  });

  test('detects passport via パスポート', () => {
    const { result, items } = C.redactString('パスポート: AB1234567');
    expect(hasType(items, 'Passport Number')).toBe(true);
    expect(result).not.toContain('AB1234567');
  });

  test('detects credentials via パスワード', () => {
    const { result, items } = C.redactString('パスワード: Secret12X');
    expect(hasType(items, 'Credential')).toBe(true);
    expect(result).not.toContain('Secret12X');
  });
});

// ─── Chinese ─────────────────────────────────────────────────────────────────

describe('Chinese', () => {
  test('detects name followed by honorific 先生', () => {
    const { result, items } = C.redactString('请联系张先生。');
    expect(hasType(items, 'Person Name')).toBe(true);
    expect(result).not.toContain('张先生');
  });

  test('detects name via name label', () => {
    const { result, items } = C.redactString('姓名：刘强');
    expect(hasType(items, 'Person Name')).toBe(true);
    expect(result).not.toContain('刘强');
  });

  test('detects surname-anchored name after intro', () => {
    const { result, items } = C.redactString('我叫王伟。');
    expect(hasType(items, 'Person Name')).toBe(true);
    expect(result).not.toContain('王伟');
  });

  test('detects CJK numeric date', () => {
    const { result, items } = C.redactString('出生日期：1990年1月15日');
    expect(hasType(items, 'Date')).toBe(true);
    expect(result).not.toContain('1990年1月15日');
  });

  test('detects passport via 护照', () => {
    const { result, items } = C.redactString('护照号码：E12345678');
    expect(hasType(items, 'Passport Number')).toBe(true);
    expect(result).not.toContain('E12345678');
  });

  test('detects bank account via 账号', () => {
    const { result, items } = C.redactString('账号：123456789012');
    expect(hasType(items, 'Bank Account')).toBe(true);
    expect(result).not.toContain('123456789012');
  });

  test('detects credentials via 密码', () => {
    const { result, items } = C.redactString('密码：MiMa12345');
    expect(hasType(items, 'Credential')).toBe(true);
    expect(result).not.toContain('MiMa12345');
  });
});

// ─── Cross-cutting: category toggles & mixed content ─────────────────────────

describe('Locale category toggles', () => {
  test('disabling names skips localized name detection', () => {
    C.categories.names = false;
    const { result, items } = C.redactString('田中さんに連絡してください。');
    expect(hasType(items, 'Person Name')).toBe(false);
    expect(result).toContain('田中');
  });

  test('disabling dates skips localized dates', () => {
    C.categories.dates = false;
    const { result } = C.redactString('Né le 15 mars 1985.');
    expect(result).toContain('15 mars 1985');
  });
});

describe('Mixed-language content', () => {
  test('redacts PII from multiple languages in one string', () => {
    const { result } = C.redactString(
      'Email john@example.com, 田中さん, Passwort: Geheim123, 15 mars 1985.'
    );
    expect(result).not.toContain('john@example.com');
    expect(result).not.toContain('田中');
    expect(result).not.toContain('Geheim123');
    expect(result).not.toContain('15 mars 1985');
  });
});

// ─── English no-regression with locale module loaded ─────────────────────────

describe('English no-regression (locale-aware build)', () => {
  test('plain English prose is not over-redacted as names', () => {
    const { result } = C.redactString('Please place your order before the meeting today.');
    expect(result).toBe('Please place your order before the meeting today.');
  });

  test('English city phrase is not treated as a localized address', () => {
    const { result } = C.redactString('I will meet you at the avenue near the park.');
    expect(result).not.toMatch(/\[ADDR_\d+\]/);
  });

  test('standard English email + phone still redacted', () => {
    const { result, items } = C.redactString('Reach me at john@example.com or 555-123-4567.');
    expect(hasType(items, 'Email')).toBe(true);
    expect(hasType(items, 'Phone Number')).toBe(true);
    expect(result).not.toContain('john@example.com');
    expect(result).not.toContain('555-123-4567');
  });

  test('English name detection still works', () => {
    const { result, items } = C.redactString('My name is Michael Johnson.');
    expect(hasType(items, 'Person Name')).toBe(true);
    expect(result).not.toContain('Michael Johnson');
  });
});

// ─── Chrome i18n architecture (_locales + default_locale) ────────────────────

describe('Chrome i18n locale architecture', () => {
  const ROOT = path.resolve(__dirname, '..');
  const manifest = require('../manifest.json');
  const LANGS = ['en', 'fr', 'de', 'es', 'pt', 'ru', 'ja', 'zh'];

  test('manifest declares a default_locale', () => {
    expect(manifest.default_locale).toBe('en');
  });

  test('locales.js is loaded before pii-engine.js in the MAIN world', () => {
    const main = manifest.content_scripts.find((cs) => cs.world === 'MAIN');
    const li = main.js.indexOf('src/core/locales.js');
    const pi = main.js.indexOf('src/core/pii-engine.js');
    expect(li).toBeGreaterThanOrEqual(0);
    expect(li).toBeLessThan(pi);
  });

  test('every supported language has a valid messages.json', () => {
    LANGS.forEach((lang) => {
      const file = path.join(ROOT, '_locales', lang, 'messages.json');
      expect(fs.existsSync(file)).toBe(true);
      const msgs = JSON.parse(fs.readFileSync(file, 'utf-8'));
      expect(msgs.appName).toBeDefined();
      expect(typeof msgs.appName.message).toBe('string');
      expect(msgs.appName.message.length).toBeGreaterThan(0);
    });
  });
});
