import { api } from "encore.dev/api";
import { catalogDB } from "./db";
import { salesDB } from "../sales/db";

export interface CreateOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  paymentMethodId: number;
  notes?: string;
  items: CreateOrderItem[];
}

export interface CatalogOrder {
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
  items: CreateOrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new catalog order.
export const createOrder = api<CreateOrderRequest, CatalogOrder>(
  { expose: true, method: "POST", path: "/catalog/orders" },
  async (req) => {
    const tx = await catalogDB.begin();
    
    try {
      // Get catalog settings for delivery fee
      const settings = await tx.queryRow<{
        delivery_fee: number;
        min_order_amount: number;
      }>`SELECT delivery_fee, min_order_amount FROM catalog_settings LIMIT 1`;

      if (!settings) {
        throw new Error("Catalog settings not found");
      }

      // Get payment method
      const paymentMethod = await tx.queryRow<{
        name: string;
      }>`SELECT name FROM payment_methods WHERE id = ${req.paymentMethodId} AND is_active = true`;

      if (!paymentMethod) {
        throw new Error("Payment method not found");
      }

      const subtotal = req.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const deliveryFee = subtotal >= settings.min_order_amount ? 0 : settings.delivery_fee;
      const totalAmount = subtotal + deliveryFee;
      const orderNumber = `ORD-${Date.now()}`;

      const orderRow = await tx.queryRow<{
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
      }>`
        INSERT INTO catalog_orders (
          order_number, customer_name, customer_phone, customer_email,
          delivery_address, delivery_notes, subtotal, delivery_fee, total_amount,
          payment_method, notes
        )
        VALUES (
          ${orderNumber}, ${req.customerName}, ${req.customerPhone}, ${req.customerEmail || null},
          ${req.deliveryAddress}, ${req.deliveryNotes || null}, ${subtotal}, ${deliveryFee}, ${totalAmount},
          ${paymentMethod.name}, ${req.notes || null}
        )
        RETURNING *, ${paymentMethod.name} as payment_method
      `;

      if (!orderRow) {
        throw new Error("Failed to create order");
      }

      const items = [];
      for (const item of req.items) {
        const totalPrice = item.quantity * item.unitPrice;
        await tx.exec`
          INSERT INTO catalog_order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
          VALUES (${orderRow.id}, ${item.productId}, ${item.productName}, ${item.quantity}, ${item.unitPrice}, ${totalPrice})
        `;
        items.push(item);
      }

      await tx.commit();

      return {
        id: orderRow.id,
        orderNumber: orderRow.order_number,
        customerName: orderRow.customer_name,
        customerPhone: orderRow.customer_phone,
        customerEmail: orderRow.customer_email || undefined,
        deliveryAddress: orderRow.delivery_address,
        deliveryNotes: orderRow.delivery_notes || undefined,
        subtotal: orderRow.subtotal,
        deliveryFee: orderRow.delivery_fee,
        totalAmount: orderRow.total_amount,
        paymentMethod: orderRow.payment_method,
        paymentStatus: orderRow.payment_status,
        orderStatus: orderRow.order_status,
        notes: orderRow.notes || undefined,
        items,
        createdAt: orderRow.created_at,
        updatedAt: orderRow.updated_at
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
