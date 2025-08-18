import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingBag, Calendar, User, MapPin, CreditCard, Printer, Send } from 'lucide-react';
import type { Order } from '~backend/catalog/list_orders';

export default function CatalogOrders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['catalog-orders'],
    queryFn: () => backend.catalog.listOrders()
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { orderId: number; orderStatus: string; paymentStatus?: string }) => 
      backend.catalog.updateOrderStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-orders'] });
      toast({
        title: "Berhasil",
        description: "Status pesanan berhasil diperbarui"
      });
    },
    onError: (error) => {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui status pesanan",
        variant: "destructive"
      });
    }
  });

  const { data: receiptData } = useQuery({
    queryKey: ['receipt', selectedOrder?.id],
    queryFn: () => selectedOrder ? backend.catalog.generateReceipt({ orderId: selectedOrder.id }) : null,
    enabled: !!selectedOrder && isReceiptDialogOpen
  });

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Menunggu',
      confirmed: 'Dikonfirmasi',
      processing: 'Diproses',
      shipped: 'Dikirim',
      delivered: 'Diterima',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
      paid: 'Lunas',
      failed: 'Gagal'
    };
    return statusMap[status] || status;
  };

  const handleStatusUpdate = (orderId: number, orderStatus: string, paymentStatus?: string) => {
    updateStatusMutation.mutate({ orderId, orderStatus, paymentStatus });
  };

  const printReceipt = () => {
    if (receiptData) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Struk Pembelian - ${receiptData.orderNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .order-info { margin-bottom: 20px; }
                .items { margin-bottom: 20px; }
                .total { border-top: 2px solid #000; padding-top: 10px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 5px; text-align: left; }
                .text-right { text-align: right; }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>${receiptData.storeName}</h2>
                ${receiptData.storeAddress ? `<p>${receiptData.storeAddress}</p>` : ''}
                ${receiptData.storePhone ? `<p>Telp: ${receiptData.storePhone}</p>` : ''}
              </div>
              
              <div class="order-info">
                <p><strong>No. Pesanan:</strong> ${receiptData.orderNumber}</p>
                <p><strong>Tanggal:</strong> ${formatDate(receiptData.orderDate)}</p>
                <p><strong>Pelanggan:</strong> ${receiptData.customerName}</p>
                <p><strong>Telepon:</strong> ${receiptData.customerPhone}</p>
                <p><strong>Alamat Kirim:</strong> ${receiptData.deliveryAddress}</p>
                <p><strong>Pembayaran:</strong> ${receiptData.paymentMethod}</p>
              </div>
              
              <div class="items">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Harga</th>
                      <th class="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${receiptData.items.map(item => `
                      <tr>
                        <td>${item.productName}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.unitPrice)}</td>
                        <td class="text-right">${formatCurrency(item.totalPrice)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="total">
                <table>
                  <tr>
                    <td><strong>Subtotal:</strong></td>
                    <td class="text-right"><strong>${formatCurrency(receiptData.subtotal)}</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Ongkos Kirim:</strong></td>
                    <td class="text-right"><strong>${formatCurrency(receiptData.deliveryFee)}</strong></td>
                  </tr>
                  <tr style="border-top: 1px solid #000;">
                    <td><strong>Total:</strong></td>
                    <td class="text-right"><strong>${formatCurrency(receiptData.totalAmount)}</strong></td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <p>Terima kasih atas pembelian Anda!</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pesanan Online</h1>
          <p className="text-gray-600">Kelola pesanan dari katalog online</p>
        </div>
      </div>

      <div className="space-y-4">
        {ordersData?.orders.map((order: Order) => (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{order.customerName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CreditCard className="w-4 h-4" />
                        <span>{order.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <div className="flex space-x-2 mt-1">
                    <Badge className={getStatusColor(order.orderStatus)}>
                      {getStatusText(order.orderStatus)}
                    </Badge>
                    <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                      {getStatusText(order.paymentStatus)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informasi Pelanggan:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Nama:</span> {order.customerName}</p>
                      <p><span className="font-medium">Telepon:</span> {order.customerPhone}</p>
                      {order.customerEmail && (
                        <p><span className="font-medium">Email:</span> {order.customerEmail}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Alamat Pengiriman:</h4>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-start space-x-1">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <span>{order.deliveryAddress}</span>
                      </div>
                      {order.deliveryNotes && (
                        <p className="mt-1"><span className="font-medium">Catatan:</span> {order.deliveryNotes}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Item Pesanan:</h4>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {item.quantity}x {item.productName}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t pt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Ongkos Kirim:</span>
                        <span>{formatCurrency(order.deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex space-x-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status Pesanan:</label>
                      <Select
                        value={order.orderStatus}
                        onValueChange={(value) => handleStatusUpdate(order.id, value)}
                      >
                        <SelectTrigger className="w-40 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Menunggu</SelectItem>
                          <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                          <SelectItem value="processing">Diproses</SelectItem>
                          <SelectItem value="shipped">Dikirim</SelectItem>
                          <SelectItem value="delivered">Diterima</SelectItem>
                          <SelectItem value="completed">Selesai</SelectItem>
                          <SelectItem value="cancelled">Dibatalkan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status Pembayaran:</label>
                      <Select
                        value={order.paymentStatus}
                        onValueChange={(value) => handleStatusUpdate(order.id, order.orderStatus, value)}
                      >
                        <SelectTrigger className="w-32 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Menunggu</SelectItem>
                          <SelectItem value="paid">Lunas</SelectItem>
                          <SelectItem value="failed">Gagal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Struk
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Struk Pembelian</DialogTitle>
                        </DialogHeader>
                        {receiptData && (
                          <div className="space-y-4">
                            <div className="text-center border-b pb-4">
                              <h3 className="text-lg font-bold">{receiptData.storeName}</h3>
                              {receiptData.storeAddress && <p className="text-sm">{receiptData.storeAddress}</p>}
                              {receiptData.storePhone && <p className="text-sm">Telp: {receiptData.storePhone}</p>}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p><strong>No. Pesanan:</strong> {receiptData.orderNumber}</p>
                                <p><strong>Tanggal:</strong> {formatDate(receiptData.orderDate)}</p>
                                <p><strong>Pelanggan:</strong> {receiptData.customerName}</p>
                                <p><strong>Telepon:</strong> {receiptData.customerPhone}</p>
                              </div>
                              <div>
                                <p><strong>Alamat Kirim:</strong></p>
                                <p className="text-gray-600">{receiptData.deliveryAddress}</p>
                                <p><strong>Pembayaran:</strong> {receiptData.paymentMethod}</p>
                              </div>
                            </div>

                            <div className="border-t pt-4">
                              <h4 className="font-medium mb-2">Item Pesanan:</h4>
                              <div className="space-y-2">
                                {receiptData.items.map((item, index) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span>{item.quantity}x {item.productName}</span>
                                    <span>{formatCurrency(item.totalPrice)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="border-t mt-4 pt-4 space-y-1">
                                <div className="flex justify-between">
                                  <span>Subtotal:</span>
                                  <span>{formatCurrency(receiptData.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Ongkos Kirim:</span>
                                  <span>{formatCurrency(receiptData.deliveryFee)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                  <span>Total:</span>
                                  <span>{formatCurrency(receiptData.totalAmount)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4 border-t">
                              <Button variant="outline" onClick={() => setIsReceiptDialogOpen(false)}>
                                Tutup
                              </Button>
                              <Button onClick={printReceipt}>
                                <Printer className="w-4 h-4 mr-2" />
                                Cetak Struk
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm">
                      <Send className="w-4 h-4 mr-2" />
                      Kirim Struk
                    </Button>
                  </div>
                </div>

                {order.notes && (
                  <div className="pt-2 border-t">
                    <h4 className="font-medium text-gray-900 mb-1">Catatan:</h4>
                    <p className="text-sm text-gray-600">{order.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {ordersData?.orders.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada pesanan</h3>
            <p className="text-gray-600">Pesanan dari katalog online akan muncul di sini</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
