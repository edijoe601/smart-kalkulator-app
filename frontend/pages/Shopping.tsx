import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingCart, Calculator, Download, Plus, AlertTriangle } from 'lucide-react';
import type { ShoppingNeed, CalculateNeedsRequest } from '~backend/shopping/calculate_needs';
import type { CreateShoppingListRequest } from '~backend/shopping/create_shopping_list';

export default function Shopping() {
  const [isCalculateDialogOpen, setIsCalculateDialogOpen] = useState(false);
  const [isCreateListDialogOpen, setIsCreateListDialogOpen] = useState(false);
  const [selectedNeeds, setSelectedNeeds] = useState<number[]>([]);
  const [calculateFormData, setCalculateFormData] = useState<CalculateNeedsRequest>({
    minStockDays: 7
  });
  const [listFormData, setListFormData] = useState({
    name: '',
    description: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: needsData, isLoading } = useQuery({
    queryKey: ['shopping-needs'],
    queryFn: () => backend.shopping.listNeeds()
  });

  const { data: recipesData } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => backend.recipes.list()
  });

  const calculateMutation = useMutation({
    mutationFn: (data: CalculateNeedsRequest) => backend.shopping.calculateNeeds(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-needs'] });
      setIsCalculateDialogOpen(false);
      toast({
        title: "Berhasil",
        description: "Kebutuhan belanja berhasil dihitung"
      });
    },
    onError: (error) => {
      console.error('Error calculating needs:', error);
      toast({
        title: "Error",
        description: "Gagal menghitung kebutuhan belanja",
        variant: "destructive"
      });
    }
  });

  const createListMutation = useMutation({
    mutationFn: (data: CreateShoppingListRequest) => backend.shopping.createShoppingList(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-needs'] });
      setIsCreateListDialogOpen(false);
      setSelectedNeeds([]);
      setListFormData({ name: '', description: '' });
      toast({
        title: "Berhasil",
        description: "Daftar belanja berhasil dibuat"
      });
    },
    onError: (error) => {
      console.error('Error creating shopping list:', error);
      toast({
        title: "Error",
        description: "Gagal membuat daftar belanja",
        variant: "destructive"
      });
    }
  });

  const exportMutation = useMutation({
    mutationFn: () => backend.shopping.exportNeeds(),
    onSuccess: (data) => {
      const blob = new Blob([data.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Berhasil",
        description: "Data kebutuhan belanja berhasil diekspor"
      });
    },
    onError: (error) => {
      console.error('Error exporting needs:', error);
      toast({
        title: "Error",
        description: "Gagal mengekspor data",
        variant: "destructive"
      });
    }
  });

  const handleCalculateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateMutation.mutate(calculateFormData);
  };

  const handleCreateListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedNeeds.length === 0) {
      toast({
        title: "Error",
        description: "Pilih minimal satu item untuk daftar belanja",
        variant: "destructive"
      });
      return;
    }
    createListMutation.mutate({
      name: listFormData.name,
      description: listFormData.description,
      needIds: selectedNeeds
    });
  };

  const handleNeedSelection = (needId: number, checked: boolean) => {
    if (checked) {
      setSelectedNeeds([...selectedNeeds, needId]);
    } else {
      setSelectedNeeds(selectedNeeds.filter(id => id !== needId));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    const priorityMap: Record<string, string> = {
      high: 'Tinggi',
      medium: 'Sedang',
      low: 'Rendah'
    };
    return priorityMap[priority] || priority;
  };

  const getSelectedTotal = () => {
    if (!needsData) return 0;
    return needsData.needs
      .filter(need => selectedNeeds.includes(need.id))
      .reduce((sum, need) => sum + need.totalCost, 0);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kebutuhan Belanja</h1>
          <p className="text-gray-600">Kelola kebutuhan belanja berdasarkan stok dan resep</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
            <Download className="w-4 h-4 mr-2" />
            {exportMutation.isPending ? 'Mengekspor...' : 'Ekspor'}
          </Button>
          <Dialog open={isCalculateDialogOpen} onOpenChange={setIsCalculateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calculator className="w-4 h-4 mr-2" />
                Hitung Kebutuhan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hitung Kebutuhan Belanja</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCalculateSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="minStockDays">Minimum Stok (Hari)</Label>
                  <Input
                    id="minStockDays"
                    type="number"
                    value={calculateFormData.minStockDays}
                    onChange={(e) => setCalculateFormData({ 
                      ...calculateFormData, 
                      minStockDays: parseInt(e.target.value) || 7 
                    })}
                    min="1"
                    max="365"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Berapa hari minimum stok yang ingin dipertahankan
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCalculateDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={calculateMutation.isPending}>
                    {calculateMutation.isPending ? 'Menghitung...' : 'Hitung'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          {selectedNeeds.length > 0 && (
            <Dialog open={isCreateListDialogOpen} onOpenChange={setIsCreateListDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Daftar Belanja ({selectedNeeds.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Daftar Belanja</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateListSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="listName">Nama Daftar Belanja</Label>
                    <Input
                      id="listName"
                      value={listFormData.name}
                      onChange={(e) => setListFormData({ ...listFormData, name: e.target.value })}
                      placeholder="Belanja Mingguan"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="listDescription">Deskripsi (Opsional)</Label>
                    <Input
                      id="listDescription"
                      value={listFormData.description}
                      onChange={(e) => setListFormData({ ...listFormData, description: e.target.value })}
                      placeholder="Deskripsi daftar belanja"
                    />
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Total Estimasi:</span> {formatCurrency(getSelectedTotal())}
                    </p>
                    <p className="text-sm text-blue-600">
                      {selectedNeeds.length} item dipilih
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateListDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={createListMutation.isPending}>
                      {createListMutation.isPending ? 'Membuat...' : 'Buat Daftar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Item Dibutuhkan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {needsData?.needs.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Estimasi Biaya</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(needsData?.totalCost || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Item Prioritas Tinggi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {needsData?.needs.filter(need => need.priority === 'high').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shopping Needs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Daftar Kebutuhan Belanja
          </CardTitle>
        </CardHeader>
        <CardContent>
          {needsData?.needs.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada kebutuhan belanja</h3>
              <p className="text-gray-600 mb-4">Hitung kebutuhan belanja berdasarkan stok dan resep</p>
              <Button onClick={() => setIsCalculateDialogOpen(true)}>
                <Calculator className="w-4 h-4 mr-2" />
                Hitung Kebutuhan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {needsData?.needs.map((need: ShoppingNeed) => (
                <div key={need.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Checkbox
                    checked={selectedNeeds.includes(need.id)}
                    onCheckedChange={(checked) => handleNeedSelection(need.id, checked as boolean)}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{need.ingredientName}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(need.priority)}>
                          {getPriorityText(need.priority)}
                        </Badge>
                        {need.priority === 'high' && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Stok Saat Ini:</span>
                        <p className="font-medium">{need.currentStock} {need.unit}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Dibutuhkan:</span>
                        <p className="font-medium">{need.requiredStock} {need.unit}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Kekurangan:</span>
                        <p className="font-medium text-red-600">{need.shortage} {need.unit}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Estimasi Biaya:</span>
                        <p className="font-bold text-green-600">{formatCurrency(need.totalCost)}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span>Harga per {need.unit}: {formatCurrency(need.costPerUnit)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {selectedNeeds.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">
                        {selectedNeeds.length} item dipilih
                      </p>
                      <p className="text-sm text-blue-600">
                        Total estimasi: {formatCurrency(getSelectedTotal())}
                      </p>
                    </div>
                    <Button onClick={() => setIsCreateListDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Buat Daftar Belanja
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
