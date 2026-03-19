import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import React, { Suspense, useEffect } from 'react';
import { useHashRoute } from './hooks/useHashRoute';
import { navigate } from './router';

const MenuPage = React.lazy(() =>
  import('./pages/MenuPage').then((m) => ({ default: m.MenuPage })),
);
const CartPage = React.lazy(() =>
  import('./pages/CartPage').then((m) => ({ default: m.CartPage })),
);
const OrdersPage = React.lazy(() =>
  import('./pages/OrdersPage').then((m) => ({ default: m.OrdersPage })),
);
const LoginPage = React.lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const MotoboyPage = React.lazy(() =>
  import('./pages/MotoboyPage').then((m) => ({ default: m.MotoboyPage })),
);
const AdminOrdersPage = React.lazy(() =>
  import('./pages/AdminOrdersPage').then((m) => ({
    default: m.AdminOrdersPage,
  })),
);

const ReactQueryDevtools = import.meta.env.DEV
  ? React.lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({
        default: m.ReactQueryDevtools,
      })),
    )
  : null;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): {
    hasError: true;
    error: Error;
  } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('App boundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background-light p-8 text-center dark:bg-background-dark">
          <div className="mb-6 flex size-24 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
            <svg
              className="h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Algo deu errado
          </h1>
          <p className="mb-6 max-w-md text-slate-600 dark:text-slate-400">
            Tente recarregar a pagina ou entrar em contato conosco.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-primary px-8 py-3 font-bold text-white shadow-lg transition-all hover:bg-primary/90"
          >
            Recarregar app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light text-slate-700 dark:bg-background-dark dark:text-slate-200">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/40">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <span className="text-sm font-bold">Carregando...</span>
      </div>
    </div>
  );
}

export default function App() {
  const route = useHashRoute();

  useEffect(() => {
    if (route) return;
    navigate('menu');
  }, [route]);

  let page: React.ReactNode;
  switch (route) {
    case 'login':
      page = <LoginPage />;
      break;
    case 'cart':
      page = <CartPage />;
      break;
    case 'motoboy':
      page = <MotoboyPage />;
      break;
    case 'admin':
      page = <AdminOrdersPage />;
      break;
    case 'orders':
      page = <OrdersPage />;
      break;
    default:
      page = <MenuPage />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="min-h-screen w-full"
          >
            <Suspense fallback={<LoadingScreen />}>{page}</Suspense>
          </motion.div>
        </AnimatePresence>
      </ErrorBoundary>
      {ReactQueryDevtools ? (
        <Suspense fallback={null}>
          {(() => {
            const Devtools =
              ReactQueryDevtools as unknown as React.ComponentType<{
                initialIsOpen?: boolean;
              }>;
            return <Devtools initialIsOpen={false} />;
          })()}
        </Suspense>
      ) : null}
    </QueryClientProvider>
  );
}
