import { describe, expect, it } from 'vitest';

import { Page, parsePath, pathFor } from './url';

const DONGLE = '0000aaaa0000aaaa';
const LOG = '2026-08-06--12-00-00';

const CANONICAL = [
  '/',
  '/referrals',
  `/${DONGLE}`,
  `/${DONGLE}/prime`,
  `/${DONGLE}/stream`,
  `/${DONGLE}/settings`,
  `/${DONGLE}/${LOG}`,
  `/${DONGLE}/${LOG}/10/20`,
];

describe('url', () => {
  it.each(CANONICAL)('round-trips %s', (pathname) => {
    expect(pathFor(parsePath(pathname))).toBe(pathname);
  });

  it('reads a drive range in milliseconds', () => {
    expect(parsePath(`/${DONGLE}/${LOG}/10/20`).zoom).toEqual({ start: 10000, end: 20000 });
  });

  it('reads a legacy timestamp range', () => {
    expect(parsePath(`/${DONGLE}/1000/2000`)).toMatchObject({
      name: Page.legacy, dongleId: DONGLE, legacy: { start: 1000, end: 2000 },
    });
  });

  it('does not treat auth as a device', () => {
    expect(parsePath('/auth/code').name).toBe(Page.home);
  });

  it('omits a zoom that starts at 0', () => {
    const view = { name: Page.drive, dongleId: DONGLE, routeId: LOG, zoom: { start: 0, end: 20000 } };
    expect(pathFor(view)).toBe(`/${DONGLE}/${LOG}`);
  });
});
