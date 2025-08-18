import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Megaphone, Calendar, Percent, Users } from 'lucide-react';
import type { Promotion, CreatePromotionRequest } from '~backend/promotions/create_promotion';

export default function Promotions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreatePromotionRequest>({
    name: '',
    description: '',
    type: 'general',
    discountType: 'percentage',
    discountValue: 0,
    minPurchase: 0,
    maxDiscount: 0,
    startDate: new Date(),
    endDate: new Date(),
    usageLimit: 0,
    channel: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: promotionsData, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: () => backend.promotions.listPromotions()
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePromotionRequest) => backend.promotions.createPromotion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      setIsDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        type: 'general',
        discountType: 'percentage',
        discountValue: 0,
        minPurchase: 0,
        maxDiscount: 0,
        startDate: new Date(),
        endDate: new Date(),
        usageLimit: 0,
        channel: ''
      });
      toast({
        title: "Berhasil",
        description: "Program promo berhasil ditambahkan"
      });
    },
    onError: (error) => {
      console.error('Error creating promotion:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan program promo",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

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

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      general: 'Umum',
      new_customer: 'Pelanggan Baru',
      loyalty: 'Loyalitas',
      seasonal: 'Musiman',
      flash_sale: 'Flash Sale',
      bundle: 'Paket Bundle'
    };
    return typeMap[type] || type;
  };

  const getDiscountText = (promotion: Promotion) => {
    if (promotion.discountType === 'percentage') {
      return `${promotion.discountValue}%`;
    } else {
      return formatCurrency(promotion.discountValue);
    }
  };

  const isPromotionActive = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);
    return promotion.isActive && now >= start && now <= end;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Program Promo</h1>
          <p className="text-gray-600">Kelola program promosi dan diskon untuk meningkatkan penjualan</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Promo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Program Promo Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Promo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Diskon Akhir Tahun"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi program promo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Jenis Promo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Umum</SelectItem>
                      <SelectItem value="new_customer">Pelanggan Baru</SelectItem>
                      <SelectItem value="loyalty">Loyalitas</SelectItem>
                      <SelectItem value="seasonal">Musiman</SelectItem>
                      <SelectItem value="flash_sale">Flash Sale</SelectItem>
                      <SelectItem value="bundle">Paket Bundle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discountType">Tipe Diskon</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Persentase (%)</SelectItem>
                      <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discountValue">
                    Nilai Diskon {formData.discountType === 'percentage' ? '(%)' : '(Rp)'}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="minPurchase">Minimum Pembelian (Rp)</Label>
                  <Input
                    id="minPurchase"
                    type="number"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              {formData.discountType === 'percentage' && (
                <div>
                  <Label htmlFor="maxDiscount">Maksimal Diskon (Rp)</Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Tanggal Mulai</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate.toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Tanggal Selesai</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate.toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="usageLimit">Batas Penggunaan</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
                    placeholder="0 = Tidak terbatas"
                  />
                </div>
                <div>
                  <Label htmlFor="channel">Channel Khusus</Label>
                  <Select
                    value={formData.channel}
                    onValueChange={(value) => setFormData({ ...formData, channel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua Channel</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="marketplace">Marketplace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotionsData?.promotions.map((promotion: Promotion) => (
          <Card key={promotion.id} className={isPromotionActive(promotion) ? 'border-green-200 bg-green-50' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{promotion.name}</CardTitle>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {promotion.description && (
                  <p className="text-sm text-gray-600">{promotion.description}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <Badge variant={isPromotionActive(promotion) ? 'default' : 'secondary'}>
                    {isPromotionActive(promotion) ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                  <Badge variant="outline">
                    {getTypeText(promotion.type)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Diskon:</span>
                    <span className="font-bold text-green-600">{getDiscountText(promotion)}</span>
                  </div>
                  {promotion.minPurchase && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Min. Pembelian:</span>
                      <span className="font-medium">{formatCurrency(promotion.minPurchase)}</span>
                    </div>
                  )}
                  {promotion.maxDiscount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Maks. Diskon:</span>
                      <span className="font-medium">{formatCurrency(promotion.maxDiscount)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                    </span>
                  </div>
                </div>

                {promotion.usageLimit && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Penggunaan:</span>
                    </div>
                    <span className="font-medium">
                      {promotion.currentUsage} / {promotion.usageLimit}
                    </span>
                  </div>
                )}

                {promotion.channel && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Channel:</span>
                    <Badge variant="outline" className="text-xs">
                      {promotion.channel}
                    </Badge>
                  </div>
                )}

                {promotion.discountType === 'percentage' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Percent className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Diskon {promotion.discountValue}%
                        {promotion.maxDiscount && ` (maks. ${formatCurrency(promotion.maxDiscount)})`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {promotionsData?.promotions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada program promo</h3>
            <p className="text-gray-600 mb-4">Mulai dengan menambahkan program promo pertama Anda</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Promo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
