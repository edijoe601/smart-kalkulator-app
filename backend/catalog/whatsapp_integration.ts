import { api } from "encore.dev/api";
import { catalogDB } from "./db";

export interface WhatsAppOrderRequest {
  customerName: string;
  customerPhone: string;
  message: string;
  items: Array<{
    productName: string;
    quantity: number;
  }>;
}

export interface WhatsAppResponse {
  message: string;
  orderNumber?: string;
}

// Processes WhatsApp order and generates auto-reply.
export const processWhatsAppOrder = api<WhatsAppOrderRequest, WhatsAppResponse>(
  { expose: true, method: "POST", path: "/catalog/whatsapp/order" },
  async (req) => {
    try {
      // Get store settings
      const settings = await catalogDB.queryRow<{
        store_name: string;
        delivery_fee: number;
        min_order_amount: number;
      }>`SELECT store_name, delivery_fee, min_order_amount FROM catalog_settings LIMIT 1`;

      if (!settings) {
        return {
          message: "Maaf, toko sedang tidak tersedia. Silakan coba lagi nanti."
        };
      }

      // Calculate order total
      let subtotal = 0;
      const orderItems = [];

      for (const item of req.items) {
        // Find product by name (case insensitive)
        const product = await catalogDB.queryRow<{
          id: number;
          name: string;
          selling_price: number;
          is_active: boolean;
        }>`
          SELECT id, name, selling_price, is_active
          FROM products 
          WHERE LOWER(name) LIKE LOWER(${'%' + item.productName + '%'}) 
          AND is_active = true
          LIMIT 1
        `;

        if (product) {
          const totalPrice = item.quantity * product.selling_price;
          subtotal += totalPrice;
          orderItems.push({
            productId: product.id,
            productName: product.name,
            quantity: item.quantity,
            unitPrice: product.selling_price
          });
        }
      }

      if (orderItems.length === 0) {
        return {
          message: `Halo ${req.customerName}! 👋\n\nMaaf, produk yang Anda pesan tidak ditemukan atau sedang tidak tersedia.\n\nSilakan lihat katalog lengkap kami di: ${process.env.FRONTEND_URL}/catalog\n\nTerima kasih! 🙏`
        };
      }

      const deliveryFee = subtotal >= settings.min_order_amount ? 0 : settings.delivery_fee;
      const totalAmount = subtotal + deliveryFee;

      // Create order
      const orderNumber = `WA-${Date.now()}`;
      
      const orderRow = await catalogDB.queryRow<{ id: number }>`
        INSERT INTO catalog_orders (
          order_number, customer_name, customer_phone, 
          delivery_address, subtotal, delivery_fee, total_amount,
          payment_method, notes
        )
        VALUES (
          ${orderNumber}, ${req.customerName}, ${req.customerPhone},
          'Akan dikonfirmasi via WhatsApp', ${subtotal}, ${deliveryFee}, ${totalAmount},
          'Transfer Bank', 'Pesanan via WhatsApp'
        )
        RETURNING id
      `;

      if (orderRow) {
        // Add order items
        for (const item of orderItems) {
          const totalPrice = item.quantity * item.unitPrice;
          await catalogDB.exec`
            INSERT INTO catalog_order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
            VALUES (${orderRow.id}, ${item.productId}, ${item.productName}, ${item.quantity}, ${item.unitPrice}, ${totalPrice})
          `;
        }
      }

      // Generate auto-reply message
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(amount);
      };

      let itemsList = '';
      orderItems.forEach(item => {
        itemsList += `• ${item.quantity}x ${item.productName} - ${formatCurrency(item.quantity * item.unitPrice)}\n`;
      });

      const message = `Halo ${req.customerName}! 👋

Terima kasih telah memesan di ${settings.store_name}! 

📋 *DETAIL PESANAN*
No. Pesanan: *${orderNumber}*

${itemsList}
━━━━━━━━━━━━━━━━━━━━━
Subtotal: ${formatCurrency(subtotal)}
${deliveryFee > 0 ? `Ongkir: ${formatCurrency(deliveryFee)}\n` : '🎉 *GRATIS ONGKIR!*\n'}━━━━━━━━━━━━━━━━━━━━━
*TOTAL: ${formatCurrency(totalAmount)}*

📍 *LANGKAH SELANJUTNYA:*
1. Konfirmasi alamat pengiriman lengkap
2. Pilih jadwal pengiriman yang diinginkan
3. Lakukan pembayaran ke rekening yang akan kami berikan
4. Kirim bukti transfer

Tim kami akan segera menghubungi Anda untuk konfirmasi detail pesanan.

Terima kasih! 🙏`;

      return {
        message,
        orderNumber
      };

    } catch (error) {
      console.error('WhatsApp order processing error:', error);
      return {
        message: `Halo ${req.customerName}! 👋\n\nMaaf, terjadi kesalahan saat memproses pesanan Anda. Silakan coba lagi atau hubungi kami langsung.\n\nTerima kasih! 🙏`
      };
    }
  }
);

// Generates delivery schedule options.
export const getDeliverySchedule = api<void, { schedules: string[] }>(
  { expose: true, method: "GET", path: "/catalog/whatsapp/delivery-schedule" },
  async () => {
    const schedules = [];
    const today = new Date();
    
    // Generate next 7 days schedule
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
      const dateStr = date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      
      schedules.push(`${dayName}, ${dateStr}`);
    }
    
    return { schedules };
  }
);
