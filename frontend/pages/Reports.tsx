import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Package, ShoppingCart, Calendar, Download } from 'lucide-react';

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { data: salesReport, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-report', dateRange],
    queryFn: () => backend.reports.getSalesReport({
      startDate: new Date(dateRange.startDate),
      endDate: new Date(dateRange.endDate)
    })
  });

  const { data: inventoryReport, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: () => backend.reports.getInventoryReport()
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  const exportReport = (type: string) => {
    // This would implement actual export functionality
    console.log(`Exporting ${type} report...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
          <p className="text-gray-600">Analisis dan laporan bisnis komprehensif</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => exportReport('sales')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Filter Periode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Tanggal Selesai</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="preset">Preset Periode</Label>
              <Select
                onValueChange={(value) => {
                  const today = new Date();
                  let startDate = new Date();
                  
                  switch (value) {
                    case 'today':
                      startDate = today;
                      break;
                    case 'week':
                      startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                      break;
                    case 'month':
                      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                      break;
                    case 'quarter':
                      startDate = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
                      break;
                    case 'year':
                      startDate = new Date(today.getFullYear(), 0, 1);
                      break;
                  }
                  
                  setDateRange({
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0]
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="week">7 Hari Terakhir</SelectItem>
                  <SelectItem value="month">Bulan Ini</SelectItem>
                  <SelectItem value="quarter">Kuartal Ini</SelectItem>
                  <SelectItem value="year">Tahun Ini</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales">Laporan Penjualan</TabsTrigger>
          <TabsTrigger value="inventory">Laporan Inventori</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          {salesLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              {/* Sales Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Pendapatan</CardTitle>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(salesReport?.totalRevenue || 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Transaksi</CardTitle>
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {salesReport?.totalTransactions || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Rata-rata Pembelian</CardTitle>
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(salesReport?.averageOrderValue || 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Produk Terlaris</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salesReport?.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{product.productName}</p>
                            <p className="text-sm text-gray-600">{product.quantity} terjual</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(product.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Channel Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Breakdown Channel Penjualan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salesReport?.channelBreakdown.map((channel, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{channel.channel}</p>
                          <p className="text-sm text-gray-600">{channel.transactions} transaksi</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(channel.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Daily Sales */}
              <Card>
                <CardHeader>
                  <CardTitle>Penjualan Harian</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salesReport?.dailySales.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{formatDate(day.date)}</p>
                          <p className="text-sm text-gray-600">{day.transactions} transaksi</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(day.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {inventoryLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              {/* Inventory Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Bahan Baku</CardTitle>
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {inventoryReport?.totalIngredients || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Produk</CardTitle>
                      <ShoppingCart className="w-4 h-4 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {inventoryReport?.totalProducts || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Produk Aktif</CardTitle>
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {inventoryReport?.activeProducts || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Stok Menipis</CardTitle>
                      <Package className="w-4 h-4 text-red-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {inventoryReport?.lowStockIngredients.length || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Low Stock Alert */}
              {inventoryReport?.lowStockIngredients && inventoryReport.lowStockIngredients.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Peringatan Stok Menipis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {inventoryReport.lowStockIngredients.map((ingredient) => (
                        <div key={ingredient.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div>
                            <p className="font-medium text-red-900">{ingredient.name}</p>
                            <p className="text-sm text-red-600">
                              Stok tersisa: {ingredient.currentStock} {ingredient.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-red-900">
                              {formatCurrency(ingredient.costPerUnit)} per {ingredient.unit}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Value Ingredients */}
              <Card>
                <CardHeader>
                  <CardTitle>Bahan Baku Nilai Tertinggi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inventoryReport?.topValueIngredients.map((ingredient, index) => (
                      <div key={ingredient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-green-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{ingredient.name}</p>
                            <p className="text-sm text-gray-600">{ingredient.unit}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(ingredient.stockValue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
