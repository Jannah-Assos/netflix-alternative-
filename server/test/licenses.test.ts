import { describe, expect, it } from 'vitest';
import { classifyLicense } from '../src/licenses.js';

describe('classifyLicense', () => {
  it('reconnaît le domaine public et CC0', () => {
    expect(classifyLicense(null, 'https://creativecommons.org/publicdomain/mark/1.0/')).toMatchObject({
      category: 'public-domain',
      verified: true,
    });
    expect(classifyLicense('CC0').label).toBe('CC0');
    expect(classifyLicense('Public domain').category).toBe('public-domain');
    expect(classifyLicense('PD-old-70').category).toBe('public-domain');
  });

  it('classe les Creative Commons depuis une URL', () => {
    expect(classifyLicense(null, 'https://creativecommons.org/licenses/by/4.0/')).toMatchObject({
      category: 'cc',
      label: 'CC BY 4.0',
    });
    expect(classifyLicense(null, 'http://creativecommons.org/licenses/by-sa/3.0/').label).toBe('CC BY-SA 3.0');
  });

  it('signale les licences non commerciales', () => {
    const l = classifyLicense(null, 'https://creativecommons.org/licenses/by-nc-sa/4.0/');
    expect(l).toMatchObject({ category: 'cc-nc', label: 'CC BY-NC-SA 4.0', verified: true });
  });

  it('classe les Creative Commons depuis un libellé', () => {
    expect(classifyLicense('CC BY-SA 4.0')).toMatchObject({ category: 'cc', label: 'CC BY-SA 4.0' });
    expect(classifyLicense('CC BY-NC 2.0').category).toBe('cc-nc');
  });

  it('ne déclare jamais libre ce qui est inconnu ou réservé', () => {
    expect(classifyLicense()).toMatchObject({ category: 'unknown', verified: false, label: 'Licence à vérifier' });
    expect(classifyLicense('All rights reserved')).toMatchObject({ category: 'restricted', verified: false });
    expect(classifyLicense('Licence maison').verified).toBe(false);
  });
});
