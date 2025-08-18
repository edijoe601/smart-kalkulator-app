import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Package } from 'lucide-react';
import type { Ingredient, CreateIngredientRequest } from '~backend/ingredients/create';

export default function Ingredients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateIngredientRequest>({
    name: '',
    unit: '',
    costPerUnit: 0,
    stockQuantity: 0,
    supplier: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ingredientsData, isLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => backend.ingredients.list()
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateIngredientRequest) => backend.ingredients.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      setIsDialogOpen(false);
      setFormData({
        name: '',
        unit: '',
        costPerUnit: 0,
        stockQuantity: 0,
        supplier: ''
      });
      toast({
        title: "Berhasil",
        description: "Bahan baku berhasil ditambahkan"
      });
    },
    onError: (error) => {
      console.error('Error creating ingredient:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan bahan baku",
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bahan Baku</h1>
          <p className="text-gray-600">Kelola data bahan baku untuk produksi</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Bahan Baku
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Bahan Baku Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Bahan Baku</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="unit">Satuan</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="kg, liter, pcs, dll"
                  required
                />
              </div>
              <div>
                <Label htmlFor="costPerUnit">Harga per Satuan</Label>
                <Input
                  id="costPerUnit"
                  type="number"
                  value={formData.costPerUnit}
                  onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="stockQuantity">Stok Awal</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="supplier">Supplier (Opsional)</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ingredientsData?.ingredients.map((ingredient: Ingredient) => (
          <Card key={ingredient.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{ingredient.name}</CardTitle>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Harga per {ingredient.unit}:</span>
                  <span className="font-medium">{formatCurrency(ingredient.costPerUnit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Stok:</span>
                  <span className="font-medium">{ingredient.stockQuantity} {ingredient.unit}</span>
                </div>
                {ingredient.supplier && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Supplier:</span>
                    <span className="font-medium text-sm">{ingredient.supplier}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {ingredientsData?.ingredients.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada bahan baku</h3>
            <p className="text-gray-600 mb-4">Mulai dengan menambahkan bahan baku pertama Anda</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Bahan Baku
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
