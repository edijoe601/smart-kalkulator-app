import { useQuery } from '@tanstack/react-query';
import backend from '~backend/client';
import StatCard from '../components/StatCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  TrendingUp,
  FileText,
  Package,
  ChefHat,
  ShoppingCart,
  Target,
  Megaphone,
  CreditCard
} from 'lucide-react';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => backend.dashboard.getStats()
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pendapatan"
          value={stats ? formatCurrency(stats.totalRevenue) : 'Loading...'}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          iconBg="bg-green-100"
        />
        <StatCard
          title="Total Transaksi"
          value={stats?.totalTransactions || 0}
          icon={<FileText className="w-6 h-6 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Item Bahan Baku"
          value={stats?.totalIngredients || 0}
          icon={<Package className="w-6 h-6 text-purple-600" />}
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Resep & Menu"
          value={stats?.totalRecipes || 0}
          icon={<ChefHat className="w-6 h-6 text-orange-600" />}
          iconBg="bg-orange-100"
        />
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Bahan Baku"
          value="10"
          subtitle="Item bahan baku"
          icon={<Package className="w-6 h-6 text-blue-600" />}
          iconBg="bg-blue-100"
          actions={
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Item
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                Data Bahan Baku
              </Button>
            </div>
          }
        />

        <StatCard
          title="Kalkulator HPP"
          value="6"
          subtitle="Resep & Menu"
          icon={<ChefHat className="w-6 h-6 text-green-600" />}
          iconBg="bg-green-100"
          actions={
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Buat Resep Baru
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                Data Resep & Menu
              </Button>
            </div>
          }
        />

        <StatCard
          title="Kalkulator Harga Jual"
          value="8"
          subtitle="Produk dijual"
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
          iconBg="bg-purple-100"
          actions={
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Hitung Harga Jual
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                Data Harga Jual
              </Button>
            </div>
          }
        />

        <StatCard
          title="Channel Penjualan"
          value="4"
          subtitle="Platform aktif"
          icon={<ShoppingCart className="w-6 h-6 text-orange-600" />}
          iconBg="bg-orange-100"
          actions={
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Data Channel
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                Program Promo
              </Button>
            </div>
          }
        />
      </div>

      {/* Bottom Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Kalkulator Promo"
          value="Simulator"
          subtitle="Tool simulasi promo"
          icon={<Megaphone className="w-6 h-6 text-pink-600" />}
          iconBg="bg-pink-100"
          actions={
            <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
              <Plus className="w-4 h-4 mr-2" />
              Tampilkan Simulator
            </Button>
          }
        />

        <StatCard
          title="Kalkulator Target"
          value="Planning"
          subtitle="Target penjualan"
          icon={<Target className="w-6 h-6 text-indigo-600" />}
          iconBg="bg-indigo-100"
          actions={
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Target Penjualan
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                Data Target
              </Button>
            </div>
          }
        />

        <StatCard
          title="Kalkulator Belanja"
          value="Tools"
          subtitle="Hitung kebutuhan"
          icon={<Package className="w-6 h-6 text-teal-600" />}
          iconBg="bg-teal-100"
          actions={
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Hitung Kebutuhan
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                Pengaturan
              </Button>
            </div>
          }
        />

        <StatCard
          title="POS System"
          value="6"
          subtitle="Transaksi"
          icon={<CreditCard className="w-6 h-6 text-red-600" />}
          iconBg="bg-red-100"
          actions={
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Transaksi Baru
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                Riwayat Transaksi
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
}
