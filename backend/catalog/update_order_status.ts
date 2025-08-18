import { api, APIError } from "encore.dev/api";
import { catalogDB } from "./db";
import { salesDB } from "../sales/db";

export interface UpdateOrderStatusRequest {
  orderId: number;
  orderStatus: string;
  paymentStatus?: string;
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  message: string;
}

// Updates order status and creates POS transaction when order is completed.
export const updateOrderStatus = api<UpdateOrderStatusRequest, UpdateOrderStatusResponse>(
  { expose: true, method: "PUT", path: "/catalog/orders/status" },
  async (req) => {
    const tx = await catalogDB.begin();
    
    try {
      // Get the order
      const order = await tx.queryRow<{
        id: number;
        order_number: string;
        customer_name: string;
        customer_phone: string;
        total_amount: number;
        payment_method: string;
        order_status: string;
        payment_status: string;
      }>`
        SELECT id, order_number, customer_name, customer_phone, total_amount, payment_method, order_status, payment_status
        FROM catalog_orders
        WHERE id = ${req.orderId}
      `;

      if (!order) {
        throw APIError.notFound("Order not found");
      }

      // Update order status
      await tx.exec`
        UPDATE catalog_orders
        SET order_status = ${req.orderStatus},
            payment_status = ${req.paymentStatus || order.payment_status},
            updated_at = NOW()
        WHERE id = ${req.orderId}
      `;

      // If order is completed and payment is confirmed, create POS transaction
      if (req.orderStatus === 'completed' && (req.paymentStatus === 'paid' || order.payment_status === 'paid')) {
        // Get order items
        const orderItems = await tx.queryAll<{
          product_id: number;
          product_name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        }>`
          SELECT product_id, product_name, quantity, unit_price, total_price
          FROM catalog_order_items
          WHERE order_id = ${req.orderId}
        `;

        // Create POS transaction
        const salesTx = await salesDB.begin();
        try {
          const transactionNumber = `${order.order_number}-POS`;
          
          const transactionRow = await salesTx.queryRow<{
            id: number;
          }>`
            INSERT INTO sales_transactions (
              transaction_number, customer_name, customer_phone, total_amount, 
              payment_method, status, notes
            )
            VALUES (
              ${transactionNumber}, ${order.customer_name}, ${order.customer_phone}, 
              ${order.total_amount}, ${order.payment_method}, 'completed',
              'Auto-generated from catalog order ${order.order_number}'
            )
            RETURNING id
          `;

          if (transactionRow) {
            // Add transaction items
            for (const item of orderItems) {
              await salesTx.exec`
                INSERT INTO sales_items (
                  transaction_id, product_id, product_name, quantity, unit_price, total_price
                )
                VALUES (
                  ${transactionRow.id}, ${item.product_id}, ${item.product_name}, 
                  ${item.quantity}, ${item.unit_price}, ${item.total_price}
                )
              `;
            }
          }

          await salesTx.commit();
        } catch (error) {
          await salesTx.rollback();
          throw error;
        }
      }

      await tx.commit();

      return {
        success: true,
        message: "Order status updated successfully"
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
