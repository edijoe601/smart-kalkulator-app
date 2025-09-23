import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackend } from '../hooks/useBackend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, TrendingUp } from 'lucide-react';
import type { Product, CreateProductRequest } from '~backend/products/create';
import type { Recipe } from '~backend/recipes/list';
import PriceDisplay from '../components/PriceDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import RoleGuard from '../components/RoleGuard';
import { useErrorHandler } from '../hooks/useErrorHandler';

export default function Products() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    description: '',
    recipeId: undefined,
    costPrice: 0,
    sellingPrice: 0,
    category: '',
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const backend = useBackend();
  const { handleError } = useErrorHandler();

  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products'],
    queryFn: () => backend.products.list(),
    onError: (error) => handleError(error, 'loading products')
  });

  const { data: recipesData } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => backend.recipes.list(),
    onError: (error) => handleError(error, 'loading recipes')
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductRequest) => backend.products.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        recipeId: undefined,
        costPrice: 0,
        sellingPrice: 0,
        category: '',
        isActive: true
      });
      toast({
        title: "Berhasil",
        description: "Produk berhasil ditambahkan"
      });
    },
    onError: (error) => {
      handleError(error, 'creating product');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sellingPrice <= formData.costPrice) {
      toast({
        title: "Error",
        description: "Harga jual harus lebih besar dari harga pokok",
        variant: "destructive"
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateProfitMargin = () => {
    if (formData.sellingPrice > 0) {
      return ((formData.sellingPrice - formData.costPrice) / formData.sellingPrice * 100).toFixed(1);
    }
    return '0';
  };

  if (productsLoading) {
    return <LoadingSpinner size="lg" text="Loading products..." />;
  }

  return (
    <RoleGuard allowedRoles={['user', 'admin']} requireSubscription={true}>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Harga Jual Produk</h1>
          <p className="text-gray-600">Kelola harga jual dan margin keuntungan produk</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Produk Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Produk</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="recipe">Resep (Opsional)</Label>
                <Select
                  value={formData.recipeId?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, recipeId: value ? parseInt(value) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih resep" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tanpa resep</SelectItem>
                    {recipesData?.recipes.map((recipe: Recipe) => (
                      <SelectItem key={recipe.id} value={recipe.id.toString()}>
                        {recipe.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Makanan, Minuman, dll"
                />
              </div>
              <div>
                <Label htmlFor="costPrice">Harga Pokok Produksi (HPP)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="sellingPrice">Harga Jual</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              {formData.sellingPrice > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    Margin Keuntungan: <span className="font-bold">{calculateProfitMargin()}%</span>
                  </p>
                  <p className="text-sm text-green-600">
                    Keuntungan per unit: {formatCurrency(formData.sellingPrice - formData.costPrice)}
                  </p>
                </div>
              )}
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
        {productsData?.products.map((product: Product) => (
          <Card key={product.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {product.description && (
                  <p className="text-sm text-gray-600">{product.description}</p>
                )}
                {product.category && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Kategori:</span>
                    <span className="font-medium">{product.category}</span>
                  </div>
                )}
                {product.recipeName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Resep:</span>
                    <span className="font-medium">{product.recipeName}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">HPP:</span>
                  <span className="font-medium">{formatCurrency(product.costPrice)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Harga Jual:</span>
                  <PriceDisplay 
                    originalPrice={product.costPrice * 1.5} // Example markup
                    sellingPrice={product.sellingPrice}
                    size="sm"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">HPP:</span>
                  <span className="font-bold text-green-600">{formatCurrency(product.sellingPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Margin:</span>
                  <span className="font-bold text-blue-600">{product.profitMargin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Keuntungan:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(product.sellingPrice - product.costPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${product.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {product.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {productsData?.products.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada produk</h3>
            <p className="text-gray-600 mb-4">Mulai dengan menambahkan produk pertama Anda</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Produk
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
    </RoleGuard>
  );
}
