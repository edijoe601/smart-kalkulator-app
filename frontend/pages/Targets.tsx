import { Card, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';

export default function Targets() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Target Penjualan</h1>
        <p className="text-gray-600">Kelola target penjualan dan pantau pencapaian</p>
      </div>

      <Card>
        <CardContent className="text-center py-12">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Fitur dalam pengembangan</h3>
          <p className="text-gray-600">Fitur target penjualan akan segera tersedia</p>
        </CardContent>
      </Card>
    </div>
  );
}
