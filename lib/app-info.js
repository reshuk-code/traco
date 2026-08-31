/**
 * Identity and legal facts, in one place so the About panel, the policies and
 * the metadata cannot disagree with each other.
 *
 * The bracketed values are deliberate placeholders — they are facts only the
 * company can supply, and inventing them in a published policy would be worse
 * than leaving them visibly blank.
 */
export const APP = {
  name: 'traco',
  version: '0.1.1',
  company: 'Antqr Technologies PVT LTD',
  contactEmail: '[CONTACT EMAIL]',
  address: '[REGISTERED ADDRESS]',
  jurisdiction: 'Nepal',
  effectiveDate: '1 September 2026',

  /**
   * Bump this when the policies change materially. Every account whose
   * accepted version differs is asked again on next open, which is the whole
   * reason the record stores a version rather than a yes.
   */
  termsVersion: '2026-09-01',
};
