import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
import { Plus, Minus, ShoppingCart, Trash2, Store, Phone, MapPin, CreditCard, CheckCircle } from 'lucide-react';
import type { CatalogProduct } from '~backend/catalog/list_products';
import type { CreateOrderRequest, CreateOrderItem } from '~backend/catalog/create_order';
import type { PaymentMethod } from '~backend/catalog/get_settings';

interface CartItem extends CreateOrderItem {
  id: string;
}

export default function PublicCatalog() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
    deliveryNotes: '',
    paymentMethodId: 0
  });

  const { toast } = useToast();

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['catalog-products'],
    queryFn: () => backend.catalog.listProducts()
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['catalog-settings'],
    queryFn: () => backend.catalog.getSettings()
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: CreateOrderRequest) => backend.catalog.createOrder(data),
    onSuccess: (response) => {
      setOrderNumber(response.orderNumber);
      setIsOrderComplete(true);
      setIsCheckoutOpen(false);
      setCart([]);
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        deliveryAddress: '',
        deliveryNotes: '',
        paymentMethodId: 0
      });
      toast({
        title: "Pesanan Berhasil!",
        description: `Pesanan ${response.orderNumber} telah diterima`
      });
    },
    onError: (error) => {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Gagal membuat pesanan",
        variant: "destructive"
      });
    }
  });

  const addToCart = (product: CatalogProduct) => {
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  const getDeliveryFee = () => {
    const subtotal = getSubtotal();
    const minOrder = settingsData?.settings.minOrderAmount || 0;
    const deliveryFee = settingsData?.settings.deliveryFee || 0;
    return subtotal >= minOrder ? 0 : deliveryFee;
  };

  const getTotalAmount = () => {
    return getSubtotal() + getDeliveryFee();
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Keranjang kosong",
        variant: "destructive"
      });
      return;
    }

    if (!formData.customerName || !formData.customerPhone || !formData.deliveryAddress || !formData.paymentMethodId) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua data yang diperlukan",
        variant: "destructive"
      });
      return;
    }

    const orderData: CreateOrderRequest = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail || undefined,
      deliveryAddress: formData.deliveryAddress,
      deliveryNotes: formData.deliveryNotes || undefined,
      paymentMethodId: formData.paymentMethodId,
      items: cart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    };

    createOrderMutation.mutate(orderData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getSelectedPaymentMethod = () => {
    return settingsData?.paymentMethods.find(method => method.id === formData.paymentMethodId);
  };

  if (productsLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!settingsData?.settings.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Toko Sedang Tutup</h3>
            <p className="text-gray-600">Maaf, toko online sedang tidak aktif saat ini</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{settingsData?.settings.storeName}</h1>
                {settingsData?.settings.storeDescription && (
                  <p className="text-sm text-gray-600">{settingsData.settings.storeDescription}</p>
                )}
              </div>
            </div>
            <Button 
              onClick={() => setIsCheckoutOpen(true)}
              className="relative"
              disabled={cart.length === 0}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Keranjang ({cart.length})
              {cart.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Store Info */}
      <div className="bg-blue-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
            {settingsData?.settings.storeAddress && (
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{settingsData.settings.storeAddress}</span>
              </div>
            )}
            {settingsData?.settings.storePhone && (
              <div className="flex items-center space-x-1">
                <Phone className="w-4 h-4" />
                <span>{settingsData.settings.storePhone}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <CreditCard className="w-4 h-4" />
              <span>Gratis ongkir untuk pembelian minimal {formatCurrency(settingsData?.settings.minOrderAmount || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Produk Kami</h2>
          <p className="text-gray-600">Pilih produk yang Anda inginkan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productsData?.products.map((product: CatalogProduct) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{product.description}</p>
                    )}
                    {product.category && (
                      <Badge variant="secondary" className="mt-2">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(product.sellingPrice)}
                    </span>
                    <Button size="sm" onClick={() => addToCart(product)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Tambah
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {productsData?.products.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada produk</h3>
              <p className="text-gray-600">Produk akan segera tersedia</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Checkout Pesanan</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Cart Items */}
            <div>
              <h3 className="font-medium mb-3">Pesanan Anda</h3>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between space-x-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ongkos Kirim:</span>
                    <span>{formatCurrency(getDeliveryFee())}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(getTotalAmount())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Informasi Pelanggan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Nama Lengkap *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">No. Telepon *</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customerEmail">Email (Opsional)</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="deliveryAddress">Alamat Pengiriman *</Label>
                <Textarea
                  id="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label htmlFor="deliveryNotes">Catatan Pengiriman (Opsional)</Label>
                <Textarea
                  id="deliveryNotes"
                  value={formData.deliveryNotes}
                  onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label htmlFor="paymentMethod">Metode Pembayaran *</Label>
              <Select
                value={formData.paymentMethodId.toString()}
                onValueChange={(value) => setFormData({ ...formData, paymentMethodId: parseInt(value) })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih metode pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  {settingsData?.paymentMethods.map((method: PaymentMethod) => (
                    <SelectItem key={method.id} value={method.id.toString()}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getSelectedPaymentMethod() && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Instruksi Pembayaran:</p>
                  <p className="text-sm text-blue-800 mt-1">{getSelectedPaymentMethod()?.instructions}</p>
                  {getSelectedPaymentMethod()?.accountNumber && (
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">No. Rekening:</span> {getSelectedPaymentMethod()?.accountNumber}
                    </p>
                  )}
                  {getSelectedPaymentMethod()?.accountName && (
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Atas Nama:</span> {getSelectedPaymentMethod()?.accountName}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleCheckout} 
                disabled={createOrderMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createOrderMutation.isPending ? 'Memproses...' : `Pesan Sekarang - ${formatCurrency(getTotalAmount())}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Complete Dialog */}
      <Dialog open={isOrderComplete} onOpenChange={setIsOrderComplete}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Pesanan Berhasil!</h3>
              <p className="text-gray-600 mt-1">Pesanan Anda telah diterima</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Nomor Pesanan:</p>
              <p className="font-bold text-lg">{orderNumber}</p>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Kami akan segera memproses pesanan Anda</p>
              <p>• Silakan lakukan pembayaran sesuai instruksi</p>
              <p>• Kami akan menghubungi Anda untuk konfirmasi</p>
            </div>
            <Button 
              onClick={() => setIsOrderComplete(false)}
              className="w-full"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
