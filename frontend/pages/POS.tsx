import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Minus, ShoppingCart, Trash2, CreditCard, Printer } from 'lucide-react';
import type { Product } from '~backend/products/list';
import type { CreateTransactionRequest, CreateSalesItem } from '~backend/sales/create_transaction';

interface CartItem extends CreateSalesItem {
  id: string;
}

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [includeDelivery, setIncludeDelivery] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => backend.products.list()
  });

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => backend.settings.getSettings()
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data: CreateTransactionRequest) => backend.sales.createTransaction(data),
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({ queryKey: ['sales-transactions'] });
      
      // Auto print receipt if enabled
      if (settingsData?.autoPrintReceipt) {
        printReceipt(transaction);
      }
      
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setPaymentMethod('');
      setNotes('');
      setIncludeDelivery(false);
      setDeliveryFee(0);
      
      toast({
        title: "Berhasil",
        description: "Transaksi berhasil disimpan"
      });
    },
    onError: (error) => {
      console.error('Error creating transaction:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan transaksi",
        variant: "destructive"
      });
    }
  });

  const addToCart = (product: Product) => {
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

  const getTotalAmount = () => {
    return getSubtotal() + (includeDelivery ? deliveryFee : 0);
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

    if (!paymentMethod) {
      toast({
        title: "Error",
        description: "Pilih metode pembayaran",
        variant: "destructive"
      });
      return;
    }

    const transactionData: CreateTransactionRequest = {
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      customerAddress: customerAddress || undefined,
      paymentMethod,
      notes: notes || undefined,
      deliveryFee: includeDelivery ? deliveryFee : 0,
      items: cart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    };

    createTransactionMutation.mutate(transactionData);
  };

  const printReceipt = (transaction: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow && settingsData) {
      const receiptWidth = settingsData.receiptWidth || 58;
      const isSmallReceipt = receiptWidth === 58;
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Struk Pembelian - ${transaction.transactionNumber}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                margin: 0; 
                padding: 10px;
                font-size: ${isSmallReceipt ? '10px' : '12px'};
                width: ${receiptWidth}mm;
                max-width: ${receiptWidth}mm;
              }
              .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
              .transaction-info { margin-bottom: 10px; }
              .items { margin-bottom: 10px; }
              .total { border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
              .footer { text-align: center; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
              .item-row { display: flex; justify-content: space-between; margin: 2px 0; }
              .bold { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="bold">${settingsData.storeName}</div>
              ${settingsData.storeAddress ? `<div>${settingsData.storeAddress}</div>` : ''}
              ${settingsData.storePhone ? `<div>Telp: ${settingsData.storePhone}</div>` : ''}
            </div>
            
            <div class="transaction-info">
              <div>No: ${transaction.transactionNumber}</div>
              <div>Tgl: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</div>
              ${transaction.customerName ? `<div>Pelanggan: ${transaction.customerName}</div>` : ''}
              ${transaction.customerPhone ? `<div>Telp: ${transaction.customerPhone}</div>` : ''}
              ${transaction.customerAddress ? `<div>Alamat: ${transaction.customerAddress}</div>` : ''}
              <div>Bayar: ${transaction.paymentMethod}</div>
            </div>
            
            <div class="items">
              ${transaction.items.map((item: any) => `
                <div class="item-row">
                  <span>${item.quantity}x ${item.productName}</span>
                  <span>${formatCurrency(item.totalPrice)}</span>
                </div>
              `).join('')}
            </div>
            
            <div class="total">
              <div class="item-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(transaction.subtotal)}</span>
              </div>
              ${transaction.deliveryFee > 0 ? `
                <div class="item-row">
                  <span>Ongkir:</span>
                  <span>${formatCurrency(transaction.deliveryFee)}</span>
                </div>
              ` : ''}
              <div class="item-row bold">
                <span>TOTAL:</span>
                <span>${formatCurrency(transaction.totalAmount)}</span>
              </div>
            </div>
            
            ${settingsData.receiptHeader ? `
              <div class="footer">
                ${settingsData.receiptHeader}
              </div>
            ` : ''}
            
            ${settingsData.receiptFooter ? `
              <div class="footer">
                ${settingsData.receiptFooter}
              </div>
            ` : ''}
            
            <div class="footer">
              <div>Terima kasih atas kunjungan Anda!</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Products */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Point of Sale</h1>
          <p className="text-gray-600">Pilih produk untuk ditambahkan ke keranjang</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {productsData?.products
            .filter((product: Product) => product.isActive)
            .map((product: Product) => (
            <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
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

        {productsData?.products.filter((product: Product) => product.isActive).length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada produk aktif</h3>
              <p className="text-gray-600">Tambahkan produk terlebih dahulu untuk mulai berjualan</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cart & Checkout */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Keranjang ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Keranjang kosong</p>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between space-x-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.productName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(item.unitPrice)}
                        </p>
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
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(getSubtotal())}</span>
                    </div>
                    {includeDelivery && (
                      <div className="flex justify-between items-center">
                        <span>Ongkir:</span>
                        <span>{formatCurrency(deliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-green-600">
                        {formatCurrency(getTotalAmount())}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detail Transaksi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customerName">Nama Pelanggan (Opsional)</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Masukkan nama pelanggan"
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">No. Telepon (Opsional)</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Masukkan no. telepon"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="includeDelivery"
                checked={includeDelivery}
                onCheckedChange={setIncludeDelivery}
              />
              <Label htmlFor="includeDelivery">Termasuk Pengiriman</Label>
            </div>
            {includeDelivery && (
              <>
                <div>
                  <Label htmlFor="customerAddress">Alamat Pengiriman</Label>
                  <Textarea
                    id="customerAddress"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Masukkan alamat lengkap"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryFee">Ongkos Kirim</Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih metode pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tunai</SelectItem>
                  <SelectItem value="transfer">Transfer Bank</SelectItem>
                  <SelectItem value="e-wallet">E-Wallet</SelectItem>
                  <SelectItem value="card">Kartu Kredit/Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan"
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCheckout}
              disabled={cart.length === 0 || createTransactionMutation.isPending}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {createTransactionMutation.isPending ? 'Memproses...' : `Checkout - ${formatCurrency(getTotalAmount())}`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
