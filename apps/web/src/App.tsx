import { useEffect } from 'react';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { CartPage } from './pages/CartPage';
import { CourierPage } from './pages/CourierPage';
import { LoginPage } from './pages/LoginPage';
import { MenuPage } from './pages/MenuPage';
import { OrdersPage } from './pages/OrdersPage';
import { useHashRoute } from './hooks/useHashRoute';
import { navigate } from './router';

export default function App() {
  const route = useHashRoute();

  useEffect(() => {
    if (route) return;
    navigate('menu');
  }, [route]);

  switch (route) {
    case 'login':
      return <LoginPage />;
    case 'cart':
      return <CartPage />;
    case 'courier':
      return <CourierPage />;
    case 'admin':
      return <AdminOrdersPage />;
    case 'orders':
      return <OrdersPage />;
    case 'menu':
    default:
      return <MenuPage />;
  }
}
