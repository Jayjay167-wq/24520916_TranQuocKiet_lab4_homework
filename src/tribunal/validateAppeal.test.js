import { EMPTY_APPEAL, validateAppeal } from './validateAppeal.js';

const VALID = {
  fullName: 'Nguyễn Văn A',
  email: 'manager@example.test',
  grounds: 'proportionality',
  evidenceUrl: '',
  statement: 'The second match ban doubles the rulebook tariff for the same offence.',
};

describe('validateAppeal', () => {
  it('returns no errors for a complete appeal', () => {
    expect(validateAppeal(VALID)).toEqual({});
  });

  it('flags every required field on an empty appeal, but not the evidence link', () => {
    expect(Object.keys(validateAppeal(EMPTY_APPEAL)).sort()).toEqual(['email', 'fullName', 'grounds', 'statement']);
  });

  it.each([
    ['fullName', ' ', /name/i],
    ['fullName', 'A', /at least 2/i],
    ['email', 'not-an-email', /valid email/i],
    ['email', 'a@b', /valid email/i],
    ['grounds', 'because', /choose/i],
    ['statement', 'Too short.', /at least 40/i],
    ['statement', ' '.repeat(50), /statement/i],
  ])('rejects %s = %j', (field, value, message) => {
    expect(validateAppeal({ ...VALID, [field]: value })[field]).toMatch(message);
  });

  it('trims before checking lengths', () => {
    expect(validateAppeal({ ...VALID, fullName: '  Vy  ' }).fullName).toBeUndefined();
  });

  describe('cross-field rule: evidence link vs grounds', () => {
    it('requires an evidence link when grounds is new evidence', () => {
      const errors = validateAppeal({ ...VALID, grounds: 'new-evidence', evidenceUrl: '' });
      expect(errors.evidenceUrl).toMatch(/required.*new evidence/i);
    });

    it('accepts new evidence with an https link', () => {
      expect(validateAppeal({ ...VALID, grounds: 'new-evidence', evidenceUrl: 'https://clips.example.test/42' })).toEqual({});
    });

    it('does not require a link for other grounds', () => {
      expect(validateAppeal({ ...VALID, grounds: 'procedural', evidenceUrl: '' }).evidenceUrl).toBeUndefined();
    });

    it.each(['http://clips.example.test/42', 'clips.example.test', 'javascript:alert(1)'])(
      'rejects a non-https link %j whatever the grounds',
      (evidenceUrl) => {
        expect(validateAppeal({ ...VALID, evidenceUrl }).evidenceUrl).toMatch(/https/i);
      },
    );
  });
});
