import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Calculator,
  LayoutDashboard,
  Package,
  ChefHat,
  ShoppingCart,
  CreditCard,
  Target,
  Megaphone,
  TrendingUp,
  Globe,
  ShoppingBag
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Bahan Baku', path: '/ingredients', icon: Package },
  { name: 'Resep & Menu', path: '/recipes', icon: ChefHat },
  { name: 'Harga Jual', path: '/products', icon: TrendingUp },
  { name: 'Penjualan', path: '/sales', icon: ShoppingCart },
  { name: 'POS System', path: '/pos', icon: CreditCard },
  { name: 'Katalog Online', path: '/catalog-admin', icon: Globe },
  { name: 'Pesanan Online', path: '/catalog-orders', icon: ShoppingBag },
  { name: 'Target Penjualan', path: '/targets', icon: Target },
  { name: 'Program Promo', path: '/promotions', icon: Megaphone },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Smart Kalkulator</h1>
            <p className="text-sm text-gray-500">UKM Management</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <div className="mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            MENU UTAMA
          </h2>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}
