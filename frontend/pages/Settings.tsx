import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Settings as SettingsIcon, Store, Receipt, Globe, Save } from 'lucide-react';
import type { StoreSettings, UpdateSettingsRequest } from '~backend/settings/update_settings';

export default function Settings() {
  const [formData, setFormData] = useState<UpdateSettingsRequest>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => backend.settings.getSettings(),
    onSuccess: (data) => {
      setFormData({
        storeName: data.storeName,
        storeDescription: data.storeDescription,
        storeLogoUrl: data.storeLogoUrl,
        storeAddress: data.storeAddress,
        storePhone: data.storePhone,
        storeEmail: data.storeEmail,
        storeWebsite: data.storeWebsite,
        businessType: data.businessType,
        taxNumber: data.taxNumber,
        currency: data.currency,
        timezone: data.timezone,
        receiptHeader: data.receiptHeader,
        receiptFooter: data.receiptFooter,
        receiptWidth: data.receiptWidth,
        autoPrintReceipt: data.autoPrintReceipt
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSettingsRequest) => backend.settings.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Berhasil",
        description: "Pengaturan berhasil disimpan"
      });
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const updateField = (field: keyof UpdateSettingsRequest, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-gray-600">Kelola pengaturan toko dan sistem</p>
        </div>
        <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="store">Informasi Toko</TabsTrigger>
          <TabsTrigger value="receipt">Pengaturan Struk</TabsTrigger>
          <TabsTrigger value="system">Sistem</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="store" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="w-5 h-5 mr-2" />
                  Informasi Dasar Toko
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="storeName">Nama Toko *</Label>
                    <Input
                      id="storeName"
                      value={formData.storeName || ''}
                      onChange={(e) => updateField('storeName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessType">Jenis Bisnis</Label>
                    <Select
                      value={formData.businessType || ''}
                      onValueChange={(value) => updateField('businessType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis bisnis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="food_beverage">Makanan & Minuman</SelectItem>
                        <SelectItem value="fashion">Fashion</SelectItem>
                        <SelectItem value="electronics">Elektronik</SelectItem>
                        <SelectItem value="health_beauty">Kesehatan & Kecantikan</SelectItem>
                        <SelectItem value="home_living">Rumah & Gaya Hidup</SelectItem>
                        <SelectItem value="services">Jasa</SelectItem>
                        <SelectItem value="other">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="storeDescription">Deskripsi Toko</Label>
                  <Textarea
                    id="storeDescription"
                    value={formData.storeDescription || ''}
                    onChange={(e) => updateField('storeDescription', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="storeAddress">Alamat Toko</Label>
                  <Textarea
                    id="storeAddress"
                    value={formData.storeAddress || ''}
                    onChange={(e) => updateField('storeAddress', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="storePhone">Nomor Telepon</Label>
                    <Input
                      id="storePhone"
                      value={formData.storePhone || ''}
                      onChange={(e) => updateField('storePhone', e.target.value)}
                      placeholder="081234567890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="storeEmail">Email</Label>
                    <Input
                      id="storeEmail"
                      type="email"
                      value={formData.storeEmail || ''}
                      onChange={(e) => updateField('storeEmail', e.target.value)}
                      placeholder="toko@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="storeWebsite">Website</Label>
                    <Input
                      id="storeWebsite"
                      value={formData.storeWebsite || ''}
                      onChange={(e) => updateField('storeWebsite', e.target.value)}
                      placeholder="https://www.tokosaya.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxNumber">NPWP/NIB</Label>
                    <Input
                      id="taxNumber"
                      value={formData.taxNumber || ''}
                      onChange={(e) => updateField('taxNumber', e.target.value)}
                      placeholder="Nomor NPWP atau NIB"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="storeLogoUrl">URL Logo Toko</Label>
                  <Input
                    id="storeLogoUrl"
                    value={formData.storeLogoUrl || ''}
                    onChange={(e) => updateField('storeLogoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipt" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="w-5 h-5 mr-2" />
                  Pengaturan Struk Pembelian
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="receiptWidth">Lebar Struk (mm)</Label>
                    <Select
                      value={formData.receiptWidth?.toString() || '58'}
                      onValueChange={(value) => updateField('receiptWidth', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="58">58mm (Thermal Bluetooth)</SelectItem>
                        <SelectItem value="80">80mm (Standard)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      58mm cocok untuk printer bluetooth thermal
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoPrintReceipt"
                      checked={formData.autoPrintReceipt || false}
                      onCheckedChange={(checked) => updateField('autoPrintReceipt', checked)}
                    />
                    <Label htmlFor="autoPrintReceipt">Cetak Otomatis</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="receiptHeader">Header Struk</Label>
                  <Textarea
                    id="receiptHeader"
                    value={formData.receiptHeader || ''}
                    onChange={(e) => updateField('receiptHeader', e.target.value)}
                    rows={3}
                    placeholder="Terima kasih telah berbelanja di toko kami"
                  />
                </div>

                <div>
                  <Label htmlFor="receiptFooter">Footer Struk</Label>
                  <Textarea
                    id="receiptFooter"
                    value={formData.receiptFooter || ''}
                    onChange={(e) => updateField('receiptFooter', e.target.value)}
                    rows={3}
                    placeholder="Barang yang sudah dibeli tidak dapat dikembalikan"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Preview Struk 58mm</h4>
                  <div className="bg-white border rounded p-3 font-mono text-xs" style={{ width: '200px' }}>
                    <div className="text-center border-b pb-2 mb-2">
                      <div className="font-bold">{formData.storeName || 'Nama Toko'}</div>
                      {formData.storeAddress && (
                        <div className="text-xs">{formData.storeAddress}</div>
                      )}
                      {formData.storePhone && (
                        <div className="text-xs">Telp: {formData.storePhone}</div>
                      )}
                    </div>
                    
                    <div className="mb-2">
                      <div>No: TXN-123456789</div>
                      <div>Tgl: {new Date().toLocaleDateString('id-ID')}</div>
                    </div>
                    
                    <div className="border-b pb-2 mb-2">
                      <div className="flex justify-between">
                        <span>1x Produk Contoh</span>
                        <span>50,000</span>
                      </div>
                    </div>
                    
                    <div className="border-b pb-2 mb-2">
                      <div className="flex justify-between font-bold">
                        <span>TOTAL:</span>
                        <span>50,000</span>
                      </div>
                    </div>
                    
                    {formData.receiptHeader && (
                      <div className="text-center text-xs mb-2">
                        {formData.receiptHeader}
                      </div>
                    )}
                    
                    {formData.receiptFooter && (
                      <div className="text-center text-xs">
                        {formData.receiptFooter}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Pengaturan Sistem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Mata Uang</Label>
                    <Select
                      value={formData.currency || 'IDR'}
                      onValueChange={(value) => updateField('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IDR">IDR (Rupiah)</SelectItem>
                        <SelectItem value="USD">USD (Dollar)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Zona Waktu</Label>
                    <Select
                      value={formData.timezone || 'Asia/Jakarta'}
                      onValueChange={(value) => updateField('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Jakarta">WIB (Jakarta)</SelectItem>
                        <SelectItem value="Asia/Makassar">WITA (Makassar)</SelectItem>
                        <SelectItem value="Asia/Jayapura">WIT (Jayapura)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Informasi Sistem</h4>
                  <div className="space-y-1 text-sm text-yellow-800">
                    <div>Versi Aplikasi: 1.0.0</div>
                    <div>Database: PostgreSQL</div>
                    <div>Terakhir Diperbarui: {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleDateString('id-ID') : '-'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  );
}
