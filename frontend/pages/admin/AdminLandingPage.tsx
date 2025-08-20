import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackend } from '../../hooks/useBackend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Save, Globe, Eye } from 'lucide-react';
import type { LandingPageSettings, UpdateLandingPageRequest } from '~backend/admin/landing_page';

export default function AdminLandingPage() {
  const [formData, setFormData] = useState<UpdateLandingPageRequest>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const backend = useBackend();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-landing-page-settings'],
    queryFn: () => backend.admin.getLandingPageSettings(),
    onSuccess: (data) => {
      setFormData({
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        heroCTAText: data.heroCTAText,
        featuresTitle: data.featuresTitle,
        pricingTitle: data.pricingTitle,
        trialDays: data.trialDays,
        monthlyPrice: data.monthlyPrice,
        yearlyPrice: data.yearlyPrice,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateLandingPageRequest) => backend.admin.updateLandingPageSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-page-settings'] });
      toast({
        title: "Berhasil",
        description: "Pengaturan landing page berhasil disimpan"
      });
    },
    onError: (error) => {
      console.error('Error updating landing page settings:', error);
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

  const updateField = (field: keyof UpdateLandingPageRequest, value: any) => {
    setFormData({ ...formData, [field]: value });
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
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Landing Page</h1>
          <p className="text-gray-600">Kelola konten dan pengaturan halaman utama</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => window.open('/', '_blank')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hero Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Hero Section
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="heroTitle">Judul Utama</Label>
              <Input
                id="heroTitle"
                value={formData.heroTitle || ''}
                onChange={(e) => updateField('heroTitle', e.target.value)}
                placeholder="Smart Kalkulator - Solusi POS UKM Terdepan"
              />
            </div>
            <div>
              <Label htmlFor="heroSubtitle">Subjudul</Label>
              <Textarea
                id="heroSubtitle"
                value={formData.heroSubtitle || ''}
                onChange={(e) => updateField('heroSubtitle', e.target.value)}
                rows={3}
                placeholder="Kelola bisnis UKM Anda dengan sistem POS terintegrasi..."
              />
            </div>
            <div>
              <Label htmlFor="heroCTAText">Teks Tombol CTA</Label>
              <Input
                id="heroCTAText"
                value={formData.heroCTAText || ''}
                onChange={(e) => updateField('heroCTAText', e.target.value)}
                placeholder="Mulai Trial Gratis"
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Sections */}
        <Card>
          <CardHeader>
            <CardTitle>Judul Bagian Konten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="featuresTitle">Judul Bagian Fitur</Label>
              <Input
                id="featuresTitle"
                value={formData.featuresTitle || ''}
                onChange={(e) => updateField('featuresTitle', e.target.value)}
                placeholder="Fitur Lengkap untuk Bisnis UKM"
              />
            </div>
            <div>
              <Label htmlFor="pricingTitle">Judul Bagian Harga</Label>
              <Input
                id="pricingTitle"
                value={formData.pricingTitle || ''}
                onChange={(e) => updateField('pricingTitle', e.target.value)}
                placeholder="Paket Berlangganan"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Harga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="trialDays">Durasi Trial (Hari)</Label>
              <Input
                id="trialDays"
                type="number"
                value={formData.trialDays || 14}
                onChange={(e) => updateField('trialDays', parseInt(e.target.value) || 14)}
                min="1"
                max="365"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyPrice">Harga Bulanan (Rp)</Label>
                <Input
                  id="monthlyPrice"
                  type="number"
                  value={formData.monthlyPrice || 99000}
                  onChange={(e) => updateField('monthlyPrice', parseFloat(e.target.value) || 99000)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Preview: {formatCurrency(formData.monthlyPrice || 99000)}
                </p>
              </div>
              <div>
                <Label htmlFor="yearlyPrice">Harga Tahunan (Rp)</Label>
                <Input
                  id="yearlyPrice"
                  type="number"
                  value={formData.yearlyPrice || 990000}
                  onChange={(e) => updateField('yearlyPrice', parseFloat(e.target.value) || 990000)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Preview: {formatCurrency(formData.yearlyPrice || 990000)}
                </p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Perhitungan Diskon Tahunan</h4>
              <p className="text-sm text-blue-800">
                Harga bulanan: {formatCurrency(formData.monthlyPrice || 99000)} x 12 = {formatCurrency((formData.monthlyPrice || 99000) * 12)}
              </p>
              <p className="text-sm text-blue-800">
                Harga tahunan: {formatCurrency(formData.yearlyPrice || 990000)}
              </p>
              <p className="text-sm text-blue-800 font-medium">
                Hemat: {formatCurrency(((formData.monthlyPrice || 99000) * 12) - (formData.yearlyPrice || 990000))} 
                ({(((((formData.monthlyPrice || 99000) * 12) - (formData.yearlyPrice || 990000)) / ((formData.monthlyPrice || 99000) * 12)) * 100).toFixed(1)}%)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Kontak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactEmail">Email Support</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  placeholder="support@smartkalkulator.com"
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Nomor WhatsApp</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone || ''}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  placeholder="081234567890"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle>Preview Landing Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-lg">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {formData.heroTitle || 'Smart Kalkulator - Solusi POS UKM Terdepan'}
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                  {formData.heroSubtitle || 'Kelola bisnis UKM Anda dengan sistem POS terintegrasi, katalog online, dan analisis bisnis yang powerful'}
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  {formData.heroCTAText || 'Mulai Trial Gratis'}
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  Trial gratis {formData.trialDays || 14} hari • Tidak perlu kartu kredit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
