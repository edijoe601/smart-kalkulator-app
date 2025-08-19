import { api } from "encore.dev/api";
import { salesDB } from "./db";

export interface SalesItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SalesTransaction {
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
  items: SalesItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ListTransactionsResponse {
  transactions: SalesTransaction[];
}

// Retrieves all sales transactions.
export const listTransactions = api<void, ListTransactionsResponse>(
  { expose: true, method: "GET", path: "/sales/transactions" },
  async () => {
    const transactions = await salesDB.queryAll<{
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
      updated_at: Date;
    }>`SELECT * FROM sales_transactions ORDER BY created_at DESC`;

    const transactionsWithItems: SalesTransaction[] = [];

    for (const transaction of transactions) {
      const items = await salesDB.queryAll<{
        id: number;
        product_id: number;
        product_name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }>`
        SELECT id, product_id, product_name, quantity, unit_price, total_price
        FROM sales_items
        WHERE transaction_id = ${transaction.id}
        ORDER BY id
      `;

      transactionsWithItems.push({
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
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price
        })),
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at
      });
    }

    return { transactions: transactionsWithItems };
  }
);
