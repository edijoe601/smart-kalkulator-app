import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard - Edi Joenaedi</h1>
          <p className="text-gray-600">Kelola bisnis UKM Anda dengan Smart Kalkulator</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          Transaksi Baru
        </Button>
      </div>
    </header>
  );
}
