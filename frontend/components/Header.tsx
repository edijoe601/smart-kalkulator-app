import { UserButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, Settings } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Toko</h1>
          <p className="text-gray-600">Kelola bisnis UKM Anda dengan Smart Kalkulator</p>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/admin">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Admin Panel
            </Button>
          </Link>
          <Link to="/store/pos">
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Transaksi Baru
            </Button>
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
