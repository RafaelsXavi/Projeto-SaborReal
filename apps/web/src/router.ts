export type RouteId =
  | 'login'
  | 'profile'
  | 'menu'
  | 'cart'
  | 'orders'
  | 'motoboy'
  | 'admin';

export function routeToHash(route: RouteId) {
  return `#/${route}`;
}

export function parseHashRoute(hash: string): RouteId | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  const seg = normalized.split('?')[0]?.split('#')[0]?.split('/')[1] ?? '';

  switch (seg) {
    case 'login':
    case 'profile':
    case 'menu':
    case 'cart':
    case 'orders':
    case 'motoboy':
    case 'admin':
      return seg;
    default:
      return null;
  }
}

export function navigate(route: RouteId) {
  window.location.hash = routeToHash(route);
}
