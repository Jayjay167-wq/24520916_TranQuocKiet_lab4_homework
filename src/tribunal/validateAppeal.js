/**
 * @typedef {object} AppealValues
 * @property {string} fullName
 * @property {string} email
 * @property {'' | GroundsValue} grounds
 * @property {string} evidenceUrl
 * @property {string} statement
 */

/** @typedef {'procedural' | 'new-evidence' | 'proportionality'} GroundsValue */

/** @typedef {Partial<Record<keyof AppealValues, string>>} AppealErrors */

export const GROUNDS = Object.freeze([
  { value: 'procedural', label: 'Procedural error' },
  { value: 'new-evidence', label: 'New evidence' },
  { value: 'proportionality', label: 'Sanction is disproportionate' },
]);

export const STATEMENT_MIN = 40;

/** @type {Readonly<AppealValues>} */
export const EMPTY_APPEAL = Object.freeze({
  fullName: '',
  email: '',
  grounds: '',
  evidenceUrl: '',
  statement: '',
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Pure and synchronous: called during render, never from an effect.
 * Keys appear in form order, so the error summary lists them top to bottom.
 * @param {AppealValues} values
 * @returns {AppealErrors}
 */
export function validateAppeal(values) {
  /** @type {AppealErrors} */
  const errors = {};
  const fullName = values.fullName.trim();
  const email = values.email.trim();
  const evidenceUrl = values.evidenceUrl.trim();
  const statement = values.statement.trim();

  if (!fullName) errors.fullName = 'Enter your full name.';
  else if (fullName.length < 2) errors.fullName = 'Name must be at least 2 characters.';

  if (!email) errors.email = 'Enter your email address.';
  else if (!EMAIL.test(email)) errors.email = 'Enter a valid email address, like name@example.com.';

  if (!GROUNDS.some((g) => g.value === values.grounds)) errors.grounds = 'Choose the grounds for appeal.';

  // Cross-field rule: the link is only required when the grounds are new evidence.
  if (!evidenceUrl) {
    if (values.grounds === 'new-evidence') {
      errors.evidenceUrl = 'An evidence link is required for new evidence appeals.';
    }
  } else if (!isHttpsUrl(evidenceUrl)) {
    errors.evidenceUrl = 'Evidence link must be a full https:// URL.';
  }

  if (!statement) errors.statement = 'Write your statement.';
  else if (statement.length < STATEMENT_MIN) {
    errors.statement = `Write at least ${STATEMENT_MIN} characters (${statement.length} so far).`;
  }

  return errors;
}
