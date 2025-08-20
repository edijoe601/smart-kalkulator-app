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
  ShoppingBag,
  BarChart3,
  Settings,
  Zap
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/store', icon: LayoutDashboard },
  { name: 'Bahan Baku', path: '/store/ingredients', icon: Package },
  { name: 'Resep & Menu', path: '/store/recipes', icon: ChefHat },
  { name: 'Harga Jual', path: '/store/products', icon: TrendingUp },
  { name: 'Penjualan', path: '/store/sales', icon: ShoppingCart },
  { name: 'POS System', path: '/store/pos', icon: CreditCard },
  { name: 'Katalog Online', path: '/store/catalog-admin', icon: Globe },
  { name: 'Pesanan Online', path: '/store/catalog-orders', icon: ShoppingBag },
  { name: 'Target Penjualan', path: '/store/targets', icon: Target },
  { name: 'Program Promo', path: '/store/promotions', icon: Megaphone },
  { name: 'Channel Penjualan', path: '/store/channels', icon: Zap },
  { name: 'Laporan', path: '/store/reports', icon: BarChart3 },
  { name: 'Pengaturan', path: '/store/settings', icon: Settings },
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
