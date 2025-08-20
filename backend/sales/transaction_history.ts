import { api } from "encore.dev/api";
import { salesDB } from "./db";
import { getAuthData } from "~encore/auth";

export interface TransactionHistoryRequest {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  customerName?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionHistoryResponse {
  transactions: Array<{
    id: number;
    transactionNumber: string;
    customerName?: string;
    customerPhone?: string;
    totalAmount: number;
    paymentMethod: string;
    status: string;
    itemCount: number;
    createdAt: Date;
  }>;
  total: number;
}

export interface TransactionReceiptItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface TransactionReceiptResponse {
  id: number;
  transactionNumber: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  notes?: string;
  items: TransactionReceiptItem[];
  createdAt: Date;
}

// Retrieves transaction history with filters.
export const getTransactionHistory = api<TransactionHistoryRequest, TransactionHistoryResponse>(
  { auth: true, expose: true, method: "POST", path: "/sales/transactions/history" },
  async (req) => {
    const auth = getAuthData()!;
    
    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    // Add tenant filter for multi-tenant
    if (auth.tenantId) {
      whereClause += ` AND tenant_id = $${paramIndex++}`;
      params.push(auth.tenantId);
    }

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

    if (req.customerName) {
      whereClause += ` AND customer_name ILIKE $${paramIndex++}`;
      params.push(`%${req.customerName}%`);
    }

    const limit = req.limit || 50;
    const offset = req.offset || 0;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM sales_transactions 
      ${whereClause}
    `;

    const totalResult = await salesDB.rawQueryRow<{ total: number }>(countQuery, ...params);
    const total = totalResult?.total || 0;

    // Get transactions with item count
    const query = `
      SELECT 
        st.*,
        COUNT(si.id) as item_count
      FROM sales_transactions st
      LEFT JOIN sales_items si ON st.id = si.transaction_id
      ${whereClause}
      GROUP BY st.id
      ORDER BY st.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    const transactions = await salesDB.rawQueryAll<{
      id: number;
      transaction_number: string;
      customer_name: string | null;
      customer_phone: string | null;
      total_amount: number;
      payment_method: string;
      status: string;
      item_count: number;
      created_at: Date;
    }>(query, ...params);

    return {
      transactions: transactions.map(t => ({
        id: t.id,
        transactionNumber: t.transaction_number,
        customerName: t.customer_name || undefined,
        customerPhone: t.customer_phone || undefined,
        totalAmount: t.total_amount,
        paymentMethod: t.payment_method,
        status: t.status,
        itemCount: t.item_count,
        createdAt: t.created_at
      })),
      total
    };
  }
);

// Retrieves transaction receipt for reprint.
export const getTransactionReceipt = api<{ id: number }, TransactionReceiptResponse>(
  { auth: true, expose: true, method: "GET", path: "/sales/transactions/:id/receipt" },
  async (req) => {
    const auth = getAuthData()!;
    
    let whereClause = "WHERE st.id = $1";
    const params: any[] = [req.id];
    let paramIndex = 2;

    // Add tenant filter for multi-tenant
    if (auth.tenantId) {
      whereClause += ` AND st.tenant_id = $${paramIndex++}`;
      params.push(auth.tenantId);
    }

    // Get transaction details
    const transaction = await salesDB.rawQueryRow<{
      id: number;
      transaction_number: string;
      customer_name: string | null;
      customer_phone: string | null;
      customer_address: string | null;
      subtotal: number;
      delivery_fee: number;
      total_amount: number;
      payment_method: string;
      status: string;
      notes: string | null;
      created_at: Date;
    }>(
      `SELECT * FROM sales_transactions st ${whereClause}`,
      ...params
    );

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Get transaction items
    const items = await salesDB.queryAll<{
      id: number;
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>`
      SELECT id, product_name, quantity, unit_price, total_price
      FROM sales_items
      WHERE transaction_id = ${transaction.id}
      ORDER BY id
    `;

    return {
      id: transaction.id,
      transactionNumber: transaction.transaction_number,
      customerName: transaction.customer_name || undefined,
      customerPhone: transaction.customer_phone || undefined,
      customerAddress: transaction.customer_address || undefined,
      subtotal: transaction.subtotal,
      deliveryFee: transaction.delivery_fee,
      totalAmount: transaction.total_amount,
      paymentMethod: transaction.payment_method,
      status: transaction.status,
      notes: transaction.notes || undefined,
      items: items.map(item => ({
        id: item.id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price
      })),
      createdAt: transaction.created_at
    };
  }
);
