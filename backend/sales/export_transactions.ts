import { api } from "encore.dev/api";
import { salesDB } from "./db";

export interface ExportTransactionsRequest {
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

export interface ExportTransactionsResponse {
  data: string;
  filename: string;
}

// Exports sales transactions to CSV format.
export const exportTransactions = api<ExportTransactionsRequest, ExportTransactionsResponse>(
  { expose: true, method: "POST", path: "/sales/transactions/export" },
  async (req) => {
    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (req.startDate) {
      whereClause += ` AND created_at >= $${paramIndex++}`;
      params.push(req.startDate);
    }

    if (req.endDate) {
      whereClause += ` AND created_at <= $${paramIndex++}`;
      params.push(req.endDate);
    }

    if (req.status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(req.status);
    }

    const query = `
      SELECT 
        transaction_number,
        customer_name,
        customer_phone,
        total_amount,
        payment_method,
        status,
        notes,
        created_at
      FROM sales_transactions 
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const transactions = await salesDB.rawQueryAll(query, ...params);

    // Create CSV content
    const headers = [
      'No. Transaksi',
      'Nama Pelanggan',
      'Telepon',
      'Total',
      'Pembayaran',
      'Status',
      'Catatan',
      'Tanggal'
    ];

    let csvContent = headers.join(',') + '\n';

    for (const transaction of transactions) {
      const row = [
        transaction.transaction_number,
        transaction.customer_name ? `"${transaction.customer_name}"` : '',
        transaction.customer_phone || '',
        transaction.total_amount,
        transaction.payment_method,
        transaction.status,
        transaction.notes ? `"${transaction.notes}"` : '',
        new Date(transaction.created_at).toLocaleDateString('id-ID')
      ];
      csvContent += row.join(',') + '\n';
    }

    const filename = `transaksi-penjualan-${new Date().toISOString().split('T')[0]}.csv`;

    return {
      data: csvContent,
      filename
    };
  }
);
