import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Globe, Settings, ExternalLink, Copy } from 'lucide-react';

export default function Catalog() {
  const [catalogUrl] = useState(`${window.location.origin}/catalog`);
  const { toast } = useToast();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['catalog-settings'],
    queryFn: () => backend.catalog.getSettings()
  });

  const { data: productsData } = useQuery({
    queryKey: ['catalog-products'],
    queryFn: () => backend.catalog.listProducts()
  });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(catalogUrl);
      toast({
        title: "Berhasil",
        description: "Link katalog berhasil disalin"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyalin link",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Katalog Online</h1>
          <p className="text-gray-600">Kelola toko online dan katalog produk</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={copyToClipboard}>
            <Copy className="w-4 h-4 mr-2" />
            Salin Link
          </Button>
          <Button asChild>
            <a href="/catalog" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Lihat Katalog
            </a>
          </Button>
        </div>
      </div>

      {/* Store Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Pengaturan Toko
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nama Toko</Label>
              <Input value={settingsData?.settings.storeName || ''} readOnly />
            </div>
            <div>
              <Label>Status Toko</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Switch checked={settingsData?.settings.isActive} disabled />
                <span className="text-sm text-gray-600">
                  {settingsData?.settings.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>
            <div>
              <Label>Ongkos Kirim</Label>
              <Input 
                value={formatCurrency(settingsData?.settings.deliveryFee || 0)} 
                readOnly 
              />
            </div>
            <div>
              <Label>Minimum Pembelian (Gratis Ongkir)</Label>
              <Input 
                value={formatCurrency(settingsData?.settings.minOrderAmount || 0)} 
                readOnly 
              />
            </div>
          </div>
          <div>
            <Label>Alamat Toko</Label>
            <Input value={settingsData?.settings.storeAddress || ''} readOnly />
          </div>
          <div>
            <Label>Link Katalog</Label>
            <div className="flex space-x-2">
              <Input value={catalogUrl} readOnly />
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Metode Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settingsData?.paymentMethods.map((method) => (
              <Card key={method.id} className="border-2">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{method.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        method.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {method.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    {method.accountNumber && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">No. Rekening:</span> {method.accountNumber}
                      </p>
                    )}
                    {method.accountName && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Atas Nama:</span> {method.accountName}
                      </p>
                    )}
                    {method.instructions && (
                      <p className="text-xs text-gray-500">{method.instructions}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products in Catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Produk di Katalog ({productsData?.products.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productsData?.products.map((product) => (
              <Card key={product.id} className="border-2">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    )}
                    {product.category && (
                      <span className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {product.category}
                      </span>
                    )}
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(product.sellingPrice)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {productsData?.products.length === 0 && (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada produk di katalog</h3>
              <p className="text-gray-600">Aktifkan produk di halaman Harga Jual untuk menampilkannya di katalog</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
