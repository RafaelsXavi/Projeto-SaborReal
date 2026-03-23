import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useMemo, useState } from 'react';
import { apiFetch, userFriendlyError } from '../api';
import { MaterialIcon } from '../components/MaterialIcon';
import { Navigation } from '../components/Navigation';
import { useCart } from '../hooks/useCart';
import { navigate } from '../router';
import { CartHeader } from './cart/CartHeader';
import { CartItemRow } from './cart/CartItemRow';
import { CartSummary } from './cart/CartSummary';

export function CartPage() {
  const { cartLines, add, dec, remove, clear, totalCents } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [cep, setCep] = useState('');
  const [number, setNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [quote, setQuote] = useState<
    | { distanceKm: number; feeBrl: number; address: string }
    | null
  >(null);
  const [quoting, setQuoting] = useState(false);

  const deliveryFeeCents = useMemo(() => {
    if (!quote) return 0;
    return Math.round(quote.feeBrl * 100);
  }, [quote]);

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
          delivery: quote
            ? {
                cep,
                number,
                notes: notes.trim() ? notes.trim() : undefined,
              }
            : undefined,
        }),
      });

      setOrderSuccess(true);
      clear();
    } catch (err) {
      setError(userFriendlyError(err));
    } finally {
      setIsProcessing(false);
    }
  }, [cartLines, clear, quote, cep, number, notes]);

  const handleQuote = useCallback(async () => {
    setQuoting(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        cep,
        number,
      });
      const res = await apiFetch(`/v1/delivery/quote?${qs.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      });
      const body = (await res.json()) as {
        ok: boolean;
        distanceKm: number;
        fee: number;
        customerAddress: string;
      };
      setQuote({
        distanceKm: body.distanceKm,
        feeBrl: body.fee,
        address: body.customerAddress,
      });
    } catch (err) {
      setQuote(null);
      setError(userFriendlyError(err));
    } finally {
      setQuoting(false);
    }
  }, [cep, number]);

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
          type="button"
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
              type="button"
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
                    {quote ? `${quote.distanceKm.toFixed(2)} km` : 'Pendente'}
                  </span>
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-600 dark:text-slate-400">
                        CEP
                      </label>
                      <input
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        placeholder="06726-615"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-600 dark:text-slate-400">
                        Número
                      </label>
                      <input
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Observação (opcional)
                    </label>
                    <textarea
                      className="min-h-20 w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ex.: casa dos fundos, portão preto..."
                      maxLength={300}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleQuote}
                    disabled={quoting || !cep.trim() || !number.trim()}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 font-bold text-white shadow-lg transition-all hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                  >
                    {quoting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-900/20 dark:border-t-slate-900" />
                    ) : (
                      <MaterialIcon name="calculate" className="text-lg" />
                    )}
                    Calcular taxa
                  </button>

                  {quote ? (
                    <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm text-slate-700 dark:border-primary/20 dark:bg-primary/10 dark:text-slate-200">
                      <p className="font-bold">Endereço:</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {quote.address}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                          Taxa
                        </span>
                        <span className="text-sm font-black text-primary">
                          R$ {quote.feeBrl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
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
                deliveryFee={deliveryFeeCents}
                onCheckout={handleCheckout}
                isProcessing={isProcessing}
                disabled={cartLines.length === 0 || !quote}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navigation />
    </div>
  );
}
