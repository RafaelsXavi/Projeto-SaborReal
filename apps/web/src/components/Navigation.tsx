import { useHashRoute } from '../hooks/useHashRoute';
import { navigate, type RouteId } from '../router';
import { MaterialIcon } from './MaterialIcon';

export function Navigation() {
  const route = useHashRoute();

  const navItems: {
    id: string;
    icon: string;
    label: string;
    path: RouteId;
  }[] = [
    { id: 'menu', icon: 'room_service', label: 'Inicio', path: 'menu' },
    { id: 'cart', icon: 'shopping_basket', label: 'Carrinho', path: 'cart' },
    { id: 'orders', icon: 'receipt_long', label: 'Pedidos', path: 'orders' },
    { id: 'profile', icon: 'person', label: 'Perfil', path: 'orders' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white/80 pb-safe backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto grid max-w-6xl grid-cols-4 px-3 py-2 sm:px-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex min-w-0 flex-col items-center gap-1 py-1 transition-all ${
              route === item.id || (item.id === 'menu' && !route)
                ? 'scale-110 text-primary'
                : 'text-slate-400 hover:text-primary/70 dark:text-slate-500'
            }`}
          >
            <div
              className={`rounded-xl p-1.5 transition-all ${
                route === item.id || (item.id === 'menu' && !route)
                  ? 'bg-primary/10'
                  : ''
              }`}
            >
              <MaterialIcon name={item.icon} className="text-2xl" />
            </div>
            <span className="text-center text-[10px] font-black uppercase tracking-tighter">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
