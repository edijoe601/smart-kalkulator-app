import { api, APIError } from "encore.dev/api";
import { catalogDB } from "./db";

export interface ReceiptRequest {
  orderId: number;
}

export interface ReceiptResponse {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  orderDate: Date;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
}

// Generates receipt data for an order.
export const generateReceipt = api<ReceiptRequest, ReceiptResponse>(
  { expose: true, method: "GET", path: "/catalog/orders/:orderId/receipt" },
  async (req) => {
    // Get order details
    const order = await catalogDB.queryRow<{
      order_number: string;
      customer_name: string;
      customer_phone: string;
      delivery_address: string;
      subtotal: number;
      delivery_fee: number;
      total_amount: number;
      payment_method: string;
      created_at: Date;
    }>`
      SELECT order_number, customer_name, customer_phone, delivery_address,
             subtotal, delivery_fee, total_amount, payment_method, created_at
      FROM catalog_orders
      WHERE id = ${req.orderId}
    `;

    if (!order) {
      throw APIError.notFound("Order not found");
    }

    // Get order items
    const items = await catalogDB.queryAll<{
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>`
      SELECT product_name, quantity, unit_price, total_price
      FROM catalog_order_items
      WHERE order_id = ${req.orderId}
      ORDER BY id
    `;

    // Get store settings
    const settings = await catalogDB.queryRow<{
      store_name: string;
      store_address: string | null;
      store_phone: string | null;
    }>`
      SELECT store_name, store_address, store_phone
      FROM catalog_settings
      LIMIT 1
    `;

    return {
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      deliveryAddress: order.delivery_address,
      items: items.map(item => ({
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price
      })),
      subtotal: order.subtotal,
      deliveryFee: order.delivery_fee,
      totalAmount: order.total_amount,
      paymentMethod: order.payment_method,
      orderDate: order.created_at,
      storeName: settings?.store_name || "Smart Kalkulator Store",
      storeAddress: settings?.store_address || undefined,
      storePhone: settings?.store_phone || undefined
    };
  }
);
