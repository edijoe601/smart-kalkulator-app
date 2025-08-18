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
import { useToast } from '@/components/ui/use-toast';
import { Plus, ChefHat, Trash2 } from 'lucide-react';
import type { Recipe, CreateRecipeRequest, CreateRecipeIngredient } from '~backend/recipes/create';
import type { Ingredient } from '~backend/ingredients/list';

export default function Recipes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateRecipeRequest>({
    name: '',
    description: '',
    servingSize: 1,
    preparationTime: 0,
    cookingTime: 0,
    ingredients: []
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recipesData, isLoading: recipesLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => backend.recipes.list()
  });

  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => backend.ingredients.list()
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRecipeRequest) => backend.recipes.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setIsDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        servingSize: 1,
        preparationTime: 0,
        cookingTime: 0,
        ingredients: []
      });
      toast({
        title: "Berhasil",
        description: "Resep berhasil ditambahkan"
      });
    },
    onError: (error) => {
      console.error('Error creating recipe:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan resep",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.ingredients.length === 0) {
      toast({
        title: "Error",
        description: "Resep harus memiliki minimal 1 bahan",
        variant: "destructive"
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ingredientId: 0, quantity: 0 }]
    });
  };

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    });
  };

  const updateIngredient = (index: number, field: keyof CreateRecipeIngredient, value: number) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: updatedIngredients });
  };

  if (recipesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resep & Menu</h1>
          <p className="text-gray-600">Kelola resep dan hitung HPP produk</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Resep
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Resep Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Resep</Label>
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="servingSize">Porsi</Label>
                  <Input
                    id="servingSize"
                    type="number"
                    value={formData.servingSize}
                    onChange={(e) => setFormData({ ...formData, servingSize: parseInt(e.target.value) || 1 })}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="preparationTime">Waktu Persiapan (menit)</Label>
                  <Input
                    id="preparationTime"
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="cookingTime">Waktu Memasak (menit)</Label>
                  <Input
                    id="cookingTime"
                    type="number"
                    value={formData.cookingTime}
                    onChange={(e) => setFormData({ ...formData, cookingTime: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Bahan-bahan</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Bahan
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Select
                        value={ingredient.ingredientId.toString()}
                        onValueChange={(value) => updateIngredient(index, 'ingredientId', parseInt(value))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Pilih bahan" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredientsData?.ingredients.map((ing: Ingredient) => (
                            <SelectItem key={ing.id} value={ing.id.toString()}>
                              {ing.name} ({ing.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Jumlah"
                        value={ingredient.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-24"
                        step="0.1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeIngredient(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
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
        {recipesData?.recipes.map((recipe: Recipe) => (
          <Card key={recipe.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{recipe.name}</CardTitle>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recipe.description && (
                  <p className="text-sm text-gray-600">{recipe.description}</p>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Porsi:</span>
                  <span className="font-medium">{recipe.servingSize}</span>
                </div>
                {recipe.preparationTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Persiapan:</span>
                    <span className="font-medium">{recipe.preparationTime} menit</span>
                  </div>
                )}
                {recipe.cookingTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Memasak:</span>
                    <span className="font-medium">{recipe.cookingTime} menit</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Bahan-bahan:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={index}>
                        {ingredient.quantity} {ingredient.unit} {ingredient.ingredientName}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {recipesData?.recipes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada resep</h3>
            <p className="text-gray-600 mb-4">Mulai dengan menambahkan resep pertama Anda</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Resep
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
