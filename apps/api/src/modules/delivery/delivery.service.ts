import { env } from '../../config/env.js';

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

type Coordinates = { lat: number; lng: number };

function normalizeCep(raw: string) {
  return raw.replaceAll(/\D/g, '');
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

const cache = new Map<string, { at: number; value: unknown }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.value as T;
  const value = await fn();
  cache.set(key, { at: now, value });
  return value;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`FETCH_FAILED ${res.status} ${url}`);
  return (await res.json()) as T;
}

async function viaCep(cep: string): Promise<ViaCepResponse> {
  const normalized = normalizeCep(cep);
  return await cached(`viacep:${normalized}`, async () => {
    return await fetchJson<ViaCepResponse>(
      `https://viacep.com.br/ws/${normalized}/json/`,
      { headers: { Accept: 'application/json' } },
    );
  });
}

async function geocodeAddress(query: string): Promise<Coordinates> {
  const q = encodeURIComponent(query);
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;

  const result = await cached(`nominatim:${query}`, async () => {
    return await fetchJson<Array<{ lat: string; lon: string }>>(url, {
      headers: {
        Accept: 'application/json',
        // Nominatim requests a UA/Referer in many cases.
        'User-Agent': 'saborreal-api (vercel)',
      },
    });
  });

  const first = result[0];
  if (!first) throw new Error('GEOCODE_NOT_FOUND');
  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('GEOCODE_INVALID');
  }
  return { lat, lng };
}

async function osrmDrivingKm(a: Coordinates, b: Coordinates): Promise<number> {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`;
  const body = await cached(`osrm:${a.lng},${a.lat}:${b.lng},${b.lat}`, async () => {
    return await fetchJson<{
      routes?: Array<{ distance: number }>;
      code?: string;
    }>(url, { headers: { Accept: 'application/json' } });
  });

  const distMeters = body.routes?.[0]?.distance;
  if (typeof distMeters !== 'number' || !Number.isFinite(distMeters)) {
    throw new Error('ROUTE_NOT_FOUND');
  }
  return distMeters / 1000;
}

function formatAddress(input: {
  logradouro?: string | undefined;
  bairro?: string | undefined;
  localidade?: string | undefined;
  uf?: string | undefined;
  number?: string | undefined;
}) {
  const parts = [
    [input.logradouro, input.number].filter(Boolean).join(', '),
    input.bairro,
    [input.localidade, input.uf].filter(Boolean).join(' - '),
    'Brasil',
  ].filter(Boolean);
  return parts.join(', ');
}

let cachedRestaurantCoords: Coordinates | null = null;

async function restaurantCoords(): Promise<Coordinates> {
  if (cachedRestaurantCoords) return cachedRestaurantCoords;

  // Prefer precise address via ViaCEP, but fall back to env address text.
  const via = await viaCep(env.RESTAURANT_CEP);
  const addr = via?.erro
    ? `${env.RESTAURANT_ADDRESS} ${env.RESTAURANT_NUMBER}`.trim()
    : formatAddress({
        logradouro: via.logradouro,
        bairro: via.bairro,
        localidade: via.localidade,
        uf: via.uf,
        number: env.RESTAURANT_NUMBER || undefined,
      });

  cachedRestaurantCoords = await geocodeAddress(addr);
  return cachedRestaurantCoords;
}

export async function quoteDelivery(input: {
  cep: string;
  number: string;
}) {
  const cep = normalizeCep(input.cep);
  if (!/^\d{8}$/.test(cep)) throw new Error('INVALID_CEP');

  const addr = await viaCep(cep);
  if (addr.erro) throw new Error('CEP_NOT_FOUND');

  const customerAddress = formatAddress({
    logradouro: addr.logradouro,
    bairro: addr.bairro,
    localidade: addr.localidade,
    uf: addr.uf,
    number: input.number,
  });

  const [rest, cust] = await Promise.all([
    restaurantCoords(),
    geocodeAddress(customerAddress),
  ]);

  const distanceKm = await osrmDrivingKm(rest, cust);
  const fee = round2(distanceKm * env.DELIVERY_FEE_PER_KM);

  return {
    distanceKm: round2(distanceKm),
    fee,
    customerAddress,
  };
}
