import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.RESTAURANT_CEP = '01001000';
process.env.DELIVERY_FEE_PER_KM = '1.35';

const originalFetch = globalThis.fetch;
let routeRequested = false;
globalThis.fetch = async (input) => {
  const url = new URL(input);
  let body;
  if (url.hostname === 'viacep.com.br') {
    body = {
      logradouro: url.pathname.includes('01001000')
        ? 'Rua Restaurante'
        : 'Rua Cliente',
      localidade: 'São Paulo',
      uf: 'SP',
    };
  } else if (url.hostname === 'nominatim.openstreetmap.org') {
    body = url.searchParams.get('q').includes('Rua Restaurante')
      ? [{ lat: '-23.55', lon: '-46.63' }]
      : [{ lat: '-23.60', lon: '-46.70' }];
  } else if (url.hostname === 'router.project-osrm.org') {
    assert.equal(
      url.pathname,
      '/route/v1/driving/-46.63,-23.55;-46.7,-23.6',
      'A rota deve usar longitude e latitude do cliente como destino',
    );
    routeRequested = true;
    body = { routes: [{ distance: 8000 }] };
  } else {
    throw new Error(`Unexpected external service: ${url.hostname}`);
  }
  return Response.json(body);
};

try {
  const { quoteDelivery } = await import(
    '../dist/src/modules/delivery/delivery.service.js'
  );
  const quote = await quoteDelivery({ cep: '02002-000', number: '123' });
  assert.equal(routeRequested, true);
  assert.equal(quote.distanceKm, 8);
  assert.equal(quote.fee, 10.8);
  console.log(
    'ok - delivery route uses customer coordinates and quoted distance',
  );
} finally {
  globalThis.fetch = originalFetch;
}
