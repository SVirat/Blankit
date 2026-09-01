const { loadSource } = require('./helpers/setup');

beforeAll(() => {
  loadSource('lib/pdf-report.js');
});

describe('PDF audit report theme', () => {
  test('always renders with a white background and light palette', () => {
    const report = BlankitPDF.generateReport({
      totalRedacted: 1,
      extensionVersion: '1.0.6',
      logs: [{
        timestamp: '2026-09-01T10:00:00.000Z',
        platform: 'chatgpt.com',
        source: 'text_input',
        itemCount: 1,
        categories: ['Email']
      }]
    });

    expect(report).toContain('1.000 1.000 1.000 rg\n0 0 595.28 841.89 re f');
    expect(report).toContain('0.145 0.388 0.922 rg');
    expect(report).not.toContain('0.059 0.059 0.078 rg');
    expect(report).not.toContain('0.655 0.545 0.980 rg');
  });
});