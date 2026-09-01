const { loadPiiEngine, resetCloaker } = require('./helpers/setup');

let C;

beforeAll(() => {
  C = loadPiiEngine();
});

beforeEach(() => {
  resetCloaker();
  C.categories.names = false;
});

const countryCases = [
  ['United States', [
    ['Passport: C12345678', 'Passport Number', 'C12345678'],
    ["Driver's license: D1234567", 'Drivers License', 'D1234567'],
    ['SSN: 123-45-6789', 'SSN', '123-45-6789'],
    ['EIN: 12-3456789', 'Tax ID', '12-3456789']
  ]],
  ['India', [
    ['Aadhaar: 1234 5678 9012', 'National ID', '1234 5678 9012'],
    ['Aadhar Number: 2345-6789-0123', 'National ID', '2345-6789-0123'],
    ['PAN: ABCDE1234F', 'Tax ID', 'ABCDE1234F'],
    ['Passport: K1234567', 'Passport Number', 'K1234567'],
    ['पासपोर्ट: L2345678', 'Passport Number', 'L2345678'],
    ['Driving Licence: DL-1420110012345', 'Drivers License', 'DL-1420110012345'],
    ['ड्राइविंग लाइसेंस: MH-1420110012345', 'Drivers License', 'MH-1420110012345'],
    ['ABHA ID: 12-3456-7890-1234', 'Medical Record Number', '12-3456-7890-1234']
  ]],
  ['France', [
    ['NIR : 1 85 05 78 006 084 36', 'National ID', '1 85 05 78 006 084 36'],
    ['Passeport: 12AB34567', 'Passport Number', '12AB34567'],
    ['Permis de conduire: 123456789012', 'Drivers License', '123456789012']
  ]],
  ['Germany', [
    ['Steuer-ID: 12 345 678 901', 'Tax ID', '12 345 678 901'],
    ['Reisepassnummer: C01X00T47', 'Passport Number', 'C01X00T47'],
    ['Führerschein: B072RRE2I55', 'Drivers License', 'B072RRE2I55']
  ]],
  ['Spain', [
    ['DNI: 12345678Z', 'National ID', '12345678Z'],
    ['NIE: X1234567L', 'National ID', 'X1234567L'],
    ['Pasaporte: PAA123456', 'Passport Number', 'PAA123456'],
    ['Permiso de conducir: 12345678Z', 'Drivers License', '12345678Z']
  ]],
  ['Portugal', [
    ['NIF: 123456789', 'Tax ID', '123456789'],
    ['Passaporte: N123456', 'Passport Number', 'N123456'],
    ['Carta de condução: P-1234567', 'Drivers License', 'P-1234567']
  ]],
  ['Brazil', [
    ['CPF: 123.456.789-09', 'Tax ID', '123.456.789-09'],
    ['CNPJ: 11.222.333/0001-81', 'Tax ID', '11.222.333/0001-81'],
    ['Passaporte: BR123456', 'Passport Number', 'BR123456'],
    ['CNH: 12345678901', 'Drivers License', '12345678901']
  ]],
  ['Russia', [
    ['ИНН: 771234567890', 'Tax ID', '771234567890'],
    ['СНИЛС: 123-456-789 01', 'National ID', '123-456-789 01'],
    ['Паспорт: 45 08 123456', 'Passport Number', '45 08 123456'],
    ['Водительское удостоверение: 77 11 123456', 'Drivers License', '77 11 123456']
  ]],
  ['Japan', [
    ['マイナンバー: 1234 5678 9012', 'National ID', '1234 5678 9012'],
    ['パスポート: TR1234567', 'Passport Number', 'TR1234567'],
    ['運転免許証: 123456789012', 'Drivers License', '123456789012']
  ]],
  ['China', [
    ['身份证号：11010119900307888X', 'National ID', '11010119900307888X'],
    ['护照号码：E12345678', 'Passport Number', 'E12345678'],
    ['驾驶证：11010119900307888X', 'Drivers License', '11010119900307888X']
  ]],
  ['Italy', [
    ['Codice fiscale: RSSMRA85M01H501Z', 'National ID', 'RSSMRA85M01H501Z'],
    ['Partita IVA: 12345678901', 'Tax ID', '12345678901'],
    ['Passaporto: YA1234567', 'Passport Number', 'YA1234567'],
    ['Patente di guida: U1H700015N', 'Drivers License', 'U1H700015N']
  ]],
  ['South Korea', [
    ['주민등록번호: 900101-1234567', 'National ID', '900101-1234567'],
    ['여권번호: M12345678', 'Passport Number', 'M12345678'],
    ['운전면허번호: 서울 12-34-567890-12', 'Drivers License', '서울 12-34-567890-12'],
    ['건강보험증번호: 12345678901', 'Medical Record Number', '12345678901']
  ]]
];

describe.each(countryCases)('%s local identifiers', (country, cases) => {
  test.each(cases)('redacts %s', (text, expectedType, sensitiveValue) => {
    const { result, items } = C.redactString(text);
    expect(items.some(item => item.type === expectedType)).toBe(true);
    expect(result).not.toContain(sensitiveValue);
  });
});

describe('Local identifier false-positive controls', () => {
  test.each([
    'Reference C01X00T47',
    'Order PAA123456',
    'Sequence 45 08 123456',
    'Value DL-1420110012345'
  ])('requires a label for ambiguous value: %s', (text) => {
    expect(C.redactString(text).result).toBe(text);
  });
});