import { useQuery } from '@tanstack/react-query';
import backend from '~backend/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Calendar, User, CreditCard } from 'lucide-react';
import type { SalesTransaction } from '~backend/sales/list_transactions';

export default function Sales() {
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['sales-transactions'],
    queryFn: () => backend.sales.listTransactions()
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
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Selesai';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Penjualan</h1>
          <p className="text-gray-600">Kelola dan pantau transaksi penjualan</p>
        </div>
      </div>

      <div className="space-y-4">
        {transactionsData?.transactions.map((transaction: SalesTransaction) => (
          <Card key={transaction.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{transaction.transactionNumber}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(transaction.createdAt)}</span>
                      </div>
                      {transaction.customerName && (
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{transaction.customerName}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <CreditCard className="w-4 h-4" />
                        <span>{transaction.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(transaction.totalAmount)}
                  </p>
                  <Badge className={getStatusColor(transaction.status)}>
                    {getStatusText(transaction.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Item yang dibeli:</h4>
                  <div className="space-y-2">
                    {transaction.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {item.quantity}x {item.productName}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {transaction.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Catatan:</h4>
                    <p className="text-sm text-gray-600">{transaction.notes}</p>
                  </div>
                )}
                {transaction.customerPhone && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Telepon:</span> {transaction.customerPhone}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {transactionsData?.transactions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada transaksi</h3>
            <p className="text-gray-600">Transaksi penjualan akan muncul di sini</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
