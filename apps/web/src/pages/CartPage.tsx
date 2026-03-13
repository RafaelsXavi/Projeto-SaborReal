import { useMemo, useState } from 'react';
import { apiFetch, userFriendlyError } from '../api';
import { MaterialIcon } from '../components/MaterialIcon';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useTheme } from '../hooks/useTheme';
import { navigate } from '../router';
import { formatPrice } from '../utils/format';

export function CartPage() {
  const { user } = useAuth();
  const { toggle } = useTheme();
  const { cartLines, totalCents, totalQty, add, dec, remove, clear } =
    useCart();

  const [placing, setPlacing] = useState(false);
  const [placeResult, setPlaceResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deliveryFeeCents = 700;
  const totalWithDelivery = useMemo(
    () => (cartLines.length ? totalCents + deliveryFeeCents : 0),
    [cartLines.length, totalCents],
  );

  async function checkout() {
    setError(null);
    setPlaceResult(null);
    setPlacing(true);
    try {
      if (!user) throw new Error('UNAUTHENTICATED');
      const idempotencyKey = crypto.randomUUID();
      await apiFetch('/v1/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({
          lines: cartLines.map((l) => ({ id: l.item.id, qty: l.qty })),
        }),
      });
      clear();
      setPlaceResult('Pedido enviado com sucesso!');
    } catch (e: unknown) {
      setError(userFriendlyError(e));
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 px-4 py-4 flex items-center justify-between">
        <button
          className="flex items-center justify-center p-2 rounded-full hover:bg-primary/10 transition-colors"
          type="button"
          onClick={() => navigate('menu')}
          aria-label="Voltar"
        >
          <MaterialIcon name="arrow_back" className="text-primary" />
        </button>
        <h1 className="text-lg font-bold">Meu Carrinho</h1>
        <button
          className="flex items-center justify-center p-2 rounded-full hover:bg-primary/10 transition-colors"
          type="button"
          onClick={toggle}
          aria-label="Alternar tema"
          title="Alternar tema"
        >
          <MaterialIcon name="dark_mode" className="text-primary" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-40">
        {placeResult ? (
          <div className="mx-4 mt-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
            <MaterialIcon
              name="check_circle"
              className="text-green-600 dark:text-green-400"
            />
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              {placeResult}
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="px-4 mt-4">
            <div className="flex items-start gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
              <MaterialIcon name="error" className="text-base" />
              <p>{error}</p>
            </div>
          </div>
        ) : null}

        <section className="mt-6 px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              Itens Selecionados
            </h3>
            {cartLines.length ? (
              <button
                className="text-xs font-bold text-primary"
                type="button"
                onClick={() => {
                  setPlaceResult(null);
                  clear();
                }}
              >
                Limpar
              </button>
            ) : null}
          </div>

          {cartLines.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-primary/5">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Seu carrinho está vazio. Volte ao cardápio para adicionar itens.
              </p>
              <button
                className="mt-3 w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-colors"
                type="button"
                onClick={() => navigate('menu')}
              >
                Ver cardápio
              </button>
            </div>
          ) : (
            cartLines.map((l) => (
              <div
                className="bg-white dark:bg-slate-800/50 p-3 rounded-xl border border-primary/5 flex gap-4 items-center"
                key={l.item.id}
              >
                <div className="size-20 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MaterialIcon name="restaurant_menu" className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-base truncate">
                      {l.item.name}
                    </h4>
                    <button
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      type="button"
                      onClick={() => {
                        setPlaceResult(null);
                        remove(l.item.id);
                      }}
                      aria-label="Remover item"
                      title="Remover"
                    >
                      <MaterialIcon name="close" className="text-sm" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Observação (opcional)
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold">
                      {formatPrice(l.item.priceCents)}
                    </span>
                    <div className="flex items-center gap-3 bg-background-light dark:bg-slate-700 rounded-full px-2 py-1">
                      <button
                        className="size-6 flex items-center justify-center rounded-full bg-white dark:bg-slate-600 text-primary shadow-sm"
                        type="button"
                        onClick={() => {
                          setPlaceResult(null);
                          dec(l.item.id);
                        }}
                        aria-label="Diminuir quantidade"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold w-4 text-center">
                        {l.qty}
                      </span>
                      <button
                        className="size-6 flex items-center justify-center rounded-full bg-primary text-white shadow-sm"
                        type="button"
                        onClick={() => {
                          setPlaceResult(null);
                          add(l.item);
                        }}
                        aria-label="Aumentar quantidade"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="mt-8 px-4">
          <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-primary/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MaterialIcon name="location_on" className="text-primary" />
                <span className="font-bold text-sm">Endereço de Entrega</span>
              </div>
              <button className="text-xs font-bold text-primary" type="button">
                Alterar
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Rua das Flores, 123 - Centro, São Paulo - SP
            </p>
          </div>
        </section>

        <section className="mt-4 px-4">
          <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-primary/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MaterialIcon name="payments" className="text-primary" />
                <span className="font-bold text-sm">Forma de Pagamento</span>
              </div>
              <button className="text-xs font-bold text-primary" type="button">
                Alterar
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <MaterialIcon name="credit_card" className="text-base" />
              <span>Cartão de Crédito (Visa •••• 4582)</span>
            </div>
          </div>
        </section>

        <section className="mt-8 px-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {formatPrice(totalCents)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              Taxa de entrega
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {cartLines.length ? formatPrice(deliveryFeeCents) : formatPrice(0)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t border-primary/10 pt-4 mt-4">
            <span>Total</span>
            <span className="text-primary">
              {formatPrice(totalWithDelivery)}
            </span>
          </div>
        </section>
      </main>

      <div className="fixed bottom-16 left-0 right-0 bg-white dark:bg-background-dark border-t border-primary/10 px-4 pt-4 pb-6 z-40">
        <button
          className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
          type="button"
          onClick={checkout}
          disabled={placing || cartLines.length === 0}
        >
          <span>{placing ? 'Enviando...' : 'Finalizar pedido'}</span>
          <MaterialIcon name="arrow_forward" />
        </button>
        {!user ? (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center">
            Para finalizar, faça login como <span className="font-bold">customer</span>.
          </p>
        ) : null}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-primary/5 flex justify-around items-center h-16 px-4 z-50">
        <a
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors"
          href="#/menu"
        >
          <MaterialIcon name="home" />
          <span className="text-[10px] font-medium">Início</span>
        </a>
        <a
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors"
          href="#/menu"
        >
          <MaterialIcon name="search" />
          <span className="text-[10px] font-medium">Busca</span>
        </a>
        <a className="flex flex-col items-center gap-1 text-primary relative" href="#/cart">
          <MaterialIcon name="shopping_cart" fill />
          <span className="text-[10px] font-medium">Carrinho</span>
          {totalQty > 0 ? (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-bold size-4 flex items-center justify-center rounded-full border-2 border-white dark:border-background-dark">
              {totalQty}
            </span>
          ) : null}
        </a>
        <a
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors"
          href="#/login"
        >
          <MaterialIcon name="person" />
          <span className="text-[10px] font-medium">Perfil</span>
        </a>
      </nav>
    </div>
  );
}

