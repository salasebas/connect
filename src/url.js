const DONGLE = /^[a-f0-9]{16}$/;
const ROUTE = /^[a-f0-9-]{20}$/;
const SEC = 1000;

export const Page = {
  home: 'home',
  referrals: 'referrals',
  device: 'device',
  prime: 'prime',
  stream: 'stream',
  settings: 'settings',
  drive: 'drive',
  legacy: 'legacy',
};

const SEGMENT_PAGE = new Set([Page.prime, Page.stream, Page.settings]);

function view(name, extra) {
  return { name, dongleId: null, routeId: null, zoom: null, ...extra };
}

export function parsePath(pathname) {
  const [first, second, third, fourth] = pathname.split('/').filter(Boolean);

  if (first === Page.referrals) return view(Page.referrals);
  if (!first || !DONGLE.test(first)) return view(Page.home);

  const dongleId = first;
  if (!second) return view(Page.device, { dongleId });
  if (!third && SEGMENT_PAGE.has(second)) return view(second, { dongleId });

  if (ROUTE.test(second)) {
    const start = Number(third);
    const end = Number(fourth);
    const zoom = third != null && fourth != null && Number.isFinite(start) && Number.isFinite(end)
      ? { start: start * SEC, end: end * SEC }
      : null;
    return view(Page.drive, { dongleId, routeId: second, zoom });
  }

  const legacyStart = Number(second);
  const legacyEnd = Number(third);
  if (third != null && fourth == null && Number.isFinite(legacyStart) && Number.isFinite(legacyEnd)) {
    return view(Page.legacy, { dongleId, legacy: { start: legacyStart, end: legacyEnd } });
  }

  return view(Page.device, { dongleId });
}

// A zoom that starts at 0 is omitted. That is the URL already published for
// "from the beginning of the drive".
export function pathFor({ name, dongleId, routeId, zoom } = {}) {
  if (name === Page.referrals) return `/${Page.referrals}`;
  if (!dongleId || name === Page.home) return '/';
  if (SEGMENT_PAGE.has(name)) return `/${dongleId}/${name}`;
  if (name === Page.drive && routeId) {
    if (zoom?.start) {
      return `/${dongleId}/${routeId}/${Math.floor(zoom.start / SEC)}/${Math.floor(zoom.end / SEC)}`;
    }
    return `/${dongleId}/${routeId}`;
  }
  return `/${dongleId}`;
}
