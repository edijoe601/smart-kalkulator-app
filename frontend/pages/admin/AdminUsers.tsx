import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackend } from '../../hooks/useBackend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Users, Edit, Trash2, Store, Calendar } from 'lucide-react';
import type { Tenant, CreateTenantRequest, UpdateTenantRequest } from '~backend/admin/manage_users';

export default function AdminUsers() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [createFormData, setCreateFormData] = useState<CreateTenantRequest>({
    name: '',
    email: '',
    phone: '',
    plan: 'trial'
  });
  const [editFormData, setEditFormData] = useState<UpdateTenantRequest>({
    id: '',
    name: '',
    email: '',
    phone: '',
    plan: '',
    status: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const backend = useBackend();

  const { data: tenantsData, isLoading } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: () => backend.admin.listTenants()
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTenantRequest) => backend.admin.createTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      setIsCreateDialogOpen(false);
      setCreateFormData({
        name: '',
        email: '',
        phone: '',
        plan: 'trial'
      });
      toast({
        title: "Berhasil",
        description: "Pengguna berhasil ditambahkan"
      });
    },
    onError: (error) => {
      console.error('Error creating tenant:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan pengguna",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTenantRequest) => backend.admin.updateTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      setIsEditDialogOpen(false);
      setEditingTenant(null);
      toast({
        title: "Berhasil",
        description: "Pengguna berhasil diperbarui"
      });
    },
    onError: (error) => {
      console.error('Error updating tenant:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui pengguna",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => backend.admin.deleteTenant({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      toast({
        title: "Berhasil",
        description: "Pengguna berhasil dihapus"
      });
    },
    onError: (error) => {
      console.error('Error deleting tenant:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus pengguna",
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

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setEditFormData({
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone || '',
      plan: tenant.plan,
      status: tenant.status
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'trial':
        return 'bg-yellow-100 text-yellow-800';
      case 'monthly':
        return 'bg-blue-100 text-blue-800';
      case 'yearly':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanText = (plan: string) => {
    const planMap: Record<string, string> = {
      trial: 'Trial',
      monthly: 'Bulanan',
      yearly: 'Tahunan',
      enterprise: 'Enterprise'
    };
    return planMap[plan] || plan;
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: 'Aktif',
      inactive: 'Nonaktif',
      suspended: 'Ditangguhkan'
    };
    return statusMap[status] || status;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Pengguna</h1>
          <p className="text-gray-600">Manajemen pengguna dan toko dalam sistem</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  value={createFormData.phone}
                  onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="plan">Paket Langganan</Label>
                <Select
                  value={createFormData.plan}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, plan: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="monthly">Bulanan</SelectItem>
                    <SelectItem value="yearly">Tahunan</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
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

      <div className="space-y-4">
        {tenantsData?.tenants.map((tenant: Tenant) => (
          <Card key={tenant.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                    <p className="text-sm text-gray-600">{tenant.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPlanBadgeColor(tenant.plan)}>
                    {getPlanText(tenant.plan)}
                  </Badge>
                  <Badge className={getStatusBadgeColor(tenant.status)}>
                    {getStatusText(tenant.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">ID Tenant:</span>
                    <p className="font-medium font-mono text-xs">{tenant.id}</p>
                  </div>
                  {tenant.phone && (
                    <div>
                      <span className="text-gray-600">Telepon:</span>
                      <p className="font-medium">{tenant.phone}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Terdaftar:</span>
                    <p className="font-medium">{formatDate(tenant.createdAt)}</p>
                  </div>
                </div>

                {tenant.trialEndsAt && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        Trial berakhir: {formatDate(tenant.trialEndsAt)}
                      </span>
                    </div>
                  </div>
                )}

                {tenant.subscriptionEndsAt && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Langganan berakhir: {formatDate(tenant.subscriptionEndsAt)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(tenant)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/store?tenant=${tenant.id}`, '_blank')}
                    >
                      <Store className="w-4 h-4 mr-2" />
                      Akses Toko
                    </Button>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus pengguna "{tenant.name}"? 
                          Semua data toko akan ikut terhapus dan tidak dapat dikembalikan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(tenant.id)}>
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="editName">Nama Lengkap</Label>
              <Input
                id="editName"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="editPhone">Nomor Telepon</Label>
              <Input
                id="editPhone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editPlan">Paket Langganan</Label>
              <Select
                value={editFormData.plan}
                onValueChange={(value) => setEditFormData({ ...editFormData, plan: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editStatus">Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                  <SelectItem value="suspended">Ditangguhkan</SelectItem>
                </SelectContent>
              </Select>
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

      {tenantsData?.tenants.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada pengguna</h3>
            <p className="text-gray-600 mb-4">Mulai dengan menambahkan pengguna pertama</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pengguna
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
