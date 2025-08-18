import { api } from "encore.dev/api";
import { salesDB } from "./db";
import { SalesTransaction } from "./list_transactions";

export interface CreateSalesItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateTransactionRequest {
  customerName?: string;
  customerPhone?: string;
  paymentMethod: string;
  notes?: string;
  items: CreateSalesItem[];
}

// Creates a new sales transaction.
export const createTransaction = api<CreateTransactionRequest, SalesTransaction>(
  { expose: true, method: "POST", path: "/sales/transactions" },
  async (req) => {
    const tx = await salesDB.begin();
    
    try {
      const totalAmount = req.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const transactionNumber = `TXN-${Date.now()}`;

      const transactionRow = await tx.queryRow<{
        id: number;
        transaction_number: string;
        customer_name: string | null;
        customer_phone: string | null;
        total_amount: number;
        payment_method: string;
        status: string;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
      }>`
        INSERT INTO sales_transactions (transaction_number, customer_name, customer_phone, total_amount, payment_method, notes)
        VALUES (${transactionNumber}, ${req.customerName || null}, ${req.customerPhone || null}, ${totalAmount}, ${req.paymentMethod}, ${req.notes || null})
        RETURNING *
      `;

      if (!transactionRow) {
        throw new Error("Failed to create transaction");
      }

      const items = [];
      for (const item of req.items) {
        const totalPrice = item.quantity * item.unitPrice;
        const itemRow = await tx.queryRow<{
          id: number;
          product_id: number;
          product_name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        }>`
          INSERT INTO sales_items (transaction_id, product_id, product_name, quantity, unit_price, total_price)
          VALUES (${transactionRow.id}, ${item.productId}, ${item.productName}, ${item.quantity}, ${item.unitPrice}, ${totalPrice})
          RETURNING id, product_id, product_name, quantity, unit_price, total_price
        `;

        if (itemRow) {
          items.push({
            id: itemRow.id,
            productId: itemRow.product_id,
            productName: itemRow.product_name,
            quantity: itemRow.quantity,
            unitPrice: itemRow.unit_price,
            totalPrice: itemRow.total_price
          });
        }
      }

      await tx.commit();

      return {
        id: transactionRow.id,
        transactionNumber: transactionRow.transaction_number,
        customerName: transactionRow.customer_name || undefined,
        customerPhone: transactionRow.customer_phone || undefined,
        totalAmount: transactionRow.total_amount,
        paymentMethod: transactionRow.payment_method,
        status: transactionRow.status,
        notes: transactionRow.notes || undefined,
        items,
        createdAt: transactionRow.created_at,
        updatedAt: transactionRow.updated_at
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
