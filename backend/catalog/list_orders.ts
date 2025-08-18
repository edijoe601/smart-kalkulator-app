import { api } from "encore.dev/api";
import { catalogDB } from "./db";

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  notes?: string;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ListOrdersResponse {
  orders: Order[];
}

// Retrieves all catalog orders.
export const listOrders = api<void, ListOrdersResponse>(
  { expose: true, method: "GET", path: "/catalog/orders" },
  async () => {
    const orders = await catalogDB.queryAll<{
      id: number;
      order_number: string;
      customer_name: string;
      customer_phone: string;
      customer_email: string | null;
      delivery_address: string;
      delivery_notes: string | null;
      subtotal: number;
      delivery_fee: number;
      total_amount: number;
      payment_method: string;
      payment_status: string;
      order_status: string;
      notes: string | null;
      created_at: Date;
      updated_at: Date;
    }>`SELECT * FROM catalog_orders ORDER BY created_at DESC`;

    const ordersWithItems: Order[] = [];

    for (const order of orders) {
      const items = await catalogDB.queryAll<{
        id: number;
        product_id: number;
        product_name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }>`
        SELECT id, product_id, product_name, quantity, unit_price, total_price
        FROM catalog_order_items
        WHERE order_id = ${order.id}
        ORDER BY id
      `;

      ordersWithItems.push({
        id: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        customerEmail: order.customer_email || undefined,
        deliveryAddress: order.delivery_address,
        deliveryNotes: order.delivery_notes || undefined,
        subtotal: order.subtotal,
        deliveryFee: order.delivery_fee,
        totalAmount: order.total_amount,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        orderStatus: order.order_status,
        notes: order.notes || undefined,
        items: items.map(item => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price
        })),
        createdAt: order.created_at,
        updatedAt: order.updated_at
      });
    }

    return { orders: ordersWithItems };
  }
);
