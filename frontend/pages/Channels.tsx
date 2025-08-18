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
import { Plus, Zap, Store, Globe, ShoppingCart, Users } from 'lucide-react';
import type { SalesChannel, CreateChannelRequest } from '~backend/channels/create_channel';

export default function Channels() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateChannelRequest>({
    name: '',
    type: 'offline',
    description: '',
    commissionRate: 0
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: channelsData, isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: () => backend.channels.listChannels()
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateChannelRequest) => backend.channels.createChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      setIsDialogOpen(false);
      setFormData({
        name: '',
        type: 'offline',
        description: '',
        commissionRate: 0
      });
      toast({
        title: "Berhasil",
        description: "Channel penjualan berhasil ditambahkan"
      });
    },
    onError: (error) => {
      console.error('Error creating channel:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan channel penjualan",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'offline':
        return <Store className="w-5 h-5 text-blue-600" />;
      case 'online':
        return <Globe className="w-5 h-5 text-green-600" />;
      case 'marketplace':
        return <ShoppingCart className="w-5 h-5 text-purple-600" />;
      case 'social':
        return <Users className="w-5 h-5 text-pink-600" />;
      default:
        return <Zap className="w-5 h-5 text-gray-600" />;
    }
  };

  const getChannelIconBg = (type: string) => {
    switch (type) {
      case 'offline':
        return 'bg-blue-100';
      case 'online':
        return 'bg-green-100';
      case 'marketplace':
        return 'bg-purple-100';
      case 'social':
        return 'bg-pink-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      offline: 'Offline',
      online: 'Online',
      marketplace: 'Marketplace',
      social: 'Media Sosial'
    };
    return typeMap[type] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'offline':
        return 'bg-blue-100 text-blue-800';
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'marketplace':
        return 'bg-purple-100 text-purple-800';
      case 'social':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Group channels by type
  const groupedChannels = channelsData?.channels.reduce((acc, channel) => {
    if (!acc[channel.type]) {
      acc[channel.type] = [];
    }
    acc[channel.type].push(channel);
    return acc;
  }, {} as Record<string, SalesChannel[]>) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Channel Penjualan</h1>
          <p className="text-gray-600">Kelola berbagai channel penjualan untuk bisnis Anda</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Channel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Channel Penjualan Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Channel</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama channel penjualan"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Tipe Channel</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="social">Media Sosial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi channel penjualan"
                />
              </div>
              <div>
                <Label htmlFor="commissionRate">Komisi/Fee (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  step="0.1"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
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

      {Object.entries(groupedChannels).map(([type, channels]) => (
        <div key={type} className="space-y-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">{getTypeText(type)}</h2>
            <Badge className={getTypeBadgeColor(type)}>
              {channels.length} Channel
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel: SalesChannel) => (
              <Card key={channel.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{channel.name}</CardTitle>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getChannelIconBg(channel.type)}`}>
                      {getChannelIcon(channel.type)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {channel.description && (
                      <p className="text-sm text-gray-600">{channel.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Badge className={getTypeBadgeColor(channel.type)}>
                        {getTypeText(channel.type)}
                      </Badge>
                      <Badge variant={channel.isActive ? 'default' : 'secondary'}>
                        {channel.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Komisi/Fee:</span>
                        <span className="font-medium">
                          {channel.commissionRate > 0 ? `${channel.commissionRate}%` : 'Gratis'}
                        </span>
                      </div>
                    </div>

                    {channel.commissionRate > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-yellow-800">
                            Fee {channel.commissionRate}% per transaksi
                          </span>
                        </div>
                      </div>
                    )}

                    {channel.type === 'marketplace' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <ShoppingCart className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">
                            Platform Marketplace
                          </span>
                        </div>
                      </div>
                    )}

                    {channel.type === 'social' && (
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-pink-600" />
                          <span className="text-sm font-medium text-pink-800">
                            Media Sosial
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {channelsData?.channels.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada channel penjualan</h3>
            <p className="text-gray-600 mb-4">Mulai dengan menambahkan channel penjualan pertama Anda</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Channel
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
