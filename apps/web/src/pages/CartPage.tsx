import { AnimatePresence, motion } from 'framer-motion';
import React, { Suspense, useCallback, useState } from 'react';
import { apiFetch, userFriendlyError } from '../api';
import { MaterialIcon } from '../components/MaterialIcon';
import { Navigation } from '../components/Navigation';
import { useCart } from '../hooks/useCart';
import { navigate } from '../router';
import { CartHeader } from './cart/CartHeader';
import { CartItemRow } from './cart/CartItemRow';
import { CartSummary } from './cart/CartSummary';

const DeliveryMap = React.lazy(() =>
  import('../components/DeliveryMap').then((m) => ({ default: m.DeliveryMap })),
);

export function CartPage() {
  const { cartLines, add, dec, remove, clear, totalCents } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  const deliveryFee = distanceKm ? distanceKm * 1.4 : 0;

  const handleCheckout = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await apiFetch('/v1/orders', {
        method: 'POST',
        headers: {
          'Idempotency-Key': `cart-${Date.now()}`,
        },
        body: JSON.stringify({
          lines: cartLines.map((it) => ({ id: it.item.id, qty: it.qty })),
          distanceKm: distanceKm || undefined,
        }),
      });

      setOrderSuccess(true);
      clear();
    } catch (err) {
      setError(userFriendlyError(err));
    } finally {
      setIsProcessing(false);
    }
  }, [cartLines, distanceKm, clear]);

  if (orderSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-8 text-center dark:bg-background-dark">
        <div className="mb-8 flex size-32 items-center justify-center rounded-[3rem] bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 animate-bounce">
          <MaterialIcon name="check_circle" className="text-6xl" />
        </div>
        <h1 className="mb-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          Pedido <span className="text-primary italic">confirmado!</span>
        </h1>
        <p className="mb-10 max-w-xs font-bold leading-relaxed text-slate-500 dark:text-slate-400">
          Seu pedido foi recebido e ja esta sendo preparado com todo carinho.
        </p>
        <button
          onClick={() => navigate('orders')}
          className="w-full max-w-xs rounded-3xl bg-slate-900 py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all hover:scale-105 active:scale-95 dark:bg-slate-100 dark:text-slate-900"
        >
          Acompanhar pedido
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 selection:bg-primary/30 dark:bg-background-dark dark:text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <CartHeader />

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-500 dark:border-rose-900/20 dark:bg-rose-900/10">
            <MaterialIcon name="error_outline" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        {cartLines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="mb-8 flex size-32 items-center justify-center rounded-[3rem] bg-white text-slate-200 shadow-xl dark:bg-slate-800 dark:text-slate-700">
              <MaterialIcon name="shopping_basket" className="text-6xl" />
            </div>
            <h2 className="mb-2 text-xl font-black text-slate-900 dark:text-slate-100">
              Seu carrinho esta vazio
            </h2>
            <p className="mb-8 text-sm font-bold italic text-slate-400">
              Que tal escolher uma delicia do cardapio?
            </p>
            <button
              onClick={() => navigate('menu')}
              className="rounded-2xl bg-primary px-10 py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95"
            >
              Ver cardapio
            </button>
          </div>
        ) : (
          <div className="mb-20 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] lg:items-start">
            <section>
              <h3 className="mb-6 flex items-center gap-2 text-xl font-black">
                Itens selecionados
                <span className="font-normal text-slate-300 dark:text-slate-700">
                  /
                </span>
                <span className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {cartLines.length} {cartLines.length === 1 ? 'item' : 'itens'}
                </span>
              </h3>
              <div className="space-y-4">
                {cartLines.map((line) => (
                  <CartItemRow
                    key={line.item.id}
                    item={{ ...line.item, qty: line.qty }}
                    onUpdateQty={(id, delta) =>
                      delta > 0 ? add(line.item) : dec(id)
                    }
                    onRemove={remove}
                  />
                ))}
              </div>
            </section>

            <section className="lg:sticky lg:top-24">
              <div className="rounded-[2rem] border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/40 sm:p-6">
                <h3 className="mb-6 flex items-center gap-2 text-xl font-black">
                  Local de entrega
                  <span className="font-normal text-slate-300 dark:text-slate-700">
                    /
                  </span>
                  <span className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {distanceKm ? `${distanceKm.toFixed(2)} km` : 'Pendente'}
                  </span>
                </h3>
                <Suspense
                  fallback={
                    <div className="flex h-64 w-full items-center justify-center rounded-3xl border border-slate-200 bg-white/50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-300 sm:h-72">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                        <span className="text-sm font-bold">Carregando mapa...</span>
                      </div>
                    </div>
                  }
                >
                  <DeliveryMap
                    onLocationSelect={(_lat, _lng, dist) => setDistanceKm(dist)}
                  />
                </Suspense>
              </div>
            </section>
          </div>
        )}
      </main>

      <AnimatePresence>
        {cartLines.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="pointer-events-none fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="pointer-events-auto mx-auto w-full max-w-6xl px-4 pb-2 sm:px-6 lg:px-8">
              <CartSummary
                subtotal={totalCents}
                deliveryFee={deliveryFee}
                onCheckout={handleCheckout}
                isProcessing={isProcessing}
                disabled={cartLines.length === 0}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navigation />
    </div>
  );
}
