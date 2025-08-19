import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Package, Edit, Trash2, Download } from 'lucide-react';
import type { Ingredient, CreateIngredientRequest } from '~backend/ingredients/create';
import type { UpdateIngredientRequest } from '~backend/ingredients/update';

export default function Ingredients() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [createFormData, setCreateFormData] = useState<CreateIngredientRequest>({
    name: '',
    unit: '',
    costPerUnit: 0,
    stockQuantity: 0,
    supplier: ''
  });
  const [editFormData, setEditFormData] = useState<UpdateIngredientRequest>({
    id: 0,
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
      setIsCreateDialogOpen(false);
      setCreateFormData({
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

  const updateMutation = useMutation({
    mutationFn: (data: UpdateIngredientRequest) => backend.ingredients.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      setIsEditDialogOpen(false);
      setEditingIngredient(null);
      toast({
        title: "Berhasil",
        description: "Bahan baku berhasil diperbarui"
      });
    },
    onError: (error) => {
      console.error('Error updating ingredient:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui bahan baku",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => backend.ingredients.deleteIngredient({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast({
        title: "Berhasil",
        description: "Bahan baku berhasil dihapus"
      });
    },
    onError: (error) => {
      console.error('Error deleting ingredient:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus bahan baku",
        variant: "destructive"
      });
    }
  });

  const exportMutation = useMutation({
    mutationFn: () => backend.ingredients.exportIngredients(),
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
        description: "Data bahan baku berhasil diekspor"
      });
    },
    onError: (error) => {
      console.error('Error exporting ingredients:', error);
      toast({
        title: "Error",
        description: "Gagal mengekspor data",
        variant: "destructive"
      });
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(createFormData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(editFormData);
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setEditFormData({
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      costPerUnit: ingredient.costPerUnit,
      stockQuantity: ingredient.stockQuantity,
      supplier: ingredient.supplier || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleExport = () => {
    exportMutation.mutate();
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
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
            <Download className="w-4 h-4 mr-2" />
            {exportMutation.isPending ? 'Mengekspor...' : 'Ekspor'}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Bahan Baku</Label>
                  <Input
                    id="name"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Satuan</Label>
                  <Input
                    id="unit"
                    value={createFormData.unit}
                    onChange={(e) => setCreateFormData({ ...createFormData, unit: e.target.value })}
                    placeholder="kg, liter, pcs, dll"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="costPerUnit">Harga per Satuan</Label>
                  <Input
                    id="costPerUnit"
                    type="number"
                    value={createFormData.costPerUnit}
                    onChange={(e) => setCreateFormData({ ...createFormData, costPerUnit: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stockQuantity">Stok Awal</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={createFormData.stockQuantity}
                    onChange={(e) => setCreateFormData({ ...createFormData, stockQuantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier (Opsional)</Label>
                  <Input
                    id="supplier"
                    value={createFormData.supplier}
                    onChange={(e) => setCreateFormData({ ...createFormData, supplier: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ingredientsData?.ingredients.map((ingredient: Ingredient) => (
          <Card key={ingredient.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{ingredient.name}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(ingredient)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Bahan Baku</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus bahan baku "{ingredient.name}"? 
                          Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(ingredient.id)}>
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bahan Baku</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="editName">Nama Bahan Baku</Label>
              <Input
                id="editName"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="editUnit">Satuan</Label>
              <Input
                id="editUnit"
                value={editFormData.unit}
                onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                placeholder="kg, liter, pcs, dll"
                required
              />
            </div>
            <div>
              <Label htmlFor="editCostPerUnit">Harga per Satuan</Label>
              <Input
                id="editCostPerUnit"
                type="number"
                value={editFormData.costPerUnit}
                onChange={(e) => setEditFormData({ ...editFormData, costPerUnit: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="editStockQuantity">Stok</Label>
              <Input
                id="editStockQuantity"
                type="number"
                value={editFormData.stockQuantity}
                onChange={(e) => setEditFormData({ ...editFormData, stockQuantity: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="editSupplier">Supplier (Opsional)</Label>
              <Input
                id="editSupplier"
                value={editFormData.supplier}
                onChange={(e) => setEditFormData({ ...editFormData, supplier: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {ingredientsData?.ingredients.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada bahan baku</h3>
            <p className="text-gray-600 mb-4">Mulai dengan menambahkan bahan baku pertama Anda</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Bahan Baku
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
