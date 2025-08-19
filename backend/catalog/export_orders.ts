import { api } from "encore.dev/api";
import { catalogDB } from "./db";

export interface ExportOrdersRequest {
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

export interface ExportOrdersResponse {
  data: string;
  filename: string;
}

// Exports catalog orders to CSV format.
export const exportOrders = api<ExportOrdersRequest, ExportOrdersResponse>(
  { expose: true, method: "POST", path: "/catalog/orders/export" },
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
      whereClause += ` AND order_status = $${paramIndex++}`;
      params.push(req.status);
    }

    const query = `
      SELECT 
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        delivery_address,
        subtotal,
        delivery_fee,
        total_amount,
        payment_method,
        payment_status,
        order_status,
        created_at
      FROM catalog_orders 
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const orders = await catalogDB.rawQueryAll(query, ...params);

    // Create CSV content
    const headers = [
      'No. Pesanan',
      'Nama Pelanggan',
      'Telepon',
      'Email',
      'Alamat',
      'Subtotal',
      'Ongkir',
      'Total',
      'Pembayaran',
      'Status Bayar',
      'Status Pesanan',
      'Tanggal'
    ];

    let csvContent = headers.join(',') + '\n';

    for (const order of orders) {
      const row = [
        order.order_number,
        `"${order.customer_name}"`,
        order.customer_phone,
        order.customer_email || '',
        `"${order.delivery_address}"`,
        order.subtotal,
        order.delivery_fee,
        order.total_amount,
        order.payment_method,
        order.payment_status,
        order.order_status,
        new Date(order.created_at).toLocaleDateString('id-ID')
      ];
      csvContent += row.join(',') + '\n';
    }

    const filename = `pesanan-online-${new Date().toISOString().split('T')[0]}.csv`;

    return {
      data: csvContent,
      filename
    };
  }
);
