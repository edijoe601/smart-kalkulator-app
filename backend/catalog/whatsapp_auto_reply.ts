import { api, Header } from "encore.dev/api";
import { catalogDB } from "./db";
import { secret } from "encore.dev/config";
import crypto from "crypto";

const whatsappWebhookSecret = secret("WhatsAppWebhookSecret");

export interface WhatsAppWebhookRequest {
  from: string;
  to: string;
  message: string;
  messageType: "text" | "image" | "audio" | "document";
  timestamp: number;
}

export interface WhatsAppWebhookParams {
  signature?: Header<"X-WhatsApp-Signature">;
  timestamp?: Header<"X-WhatsApp-Timestamp">;
}

export interface AutoReplyResponse {
  reply: string;
  actions?: string[];
  quickReplies?: string[];
}

export interface WhatsAppSettings {
  welcomeMessage: string;
  businessHours: string;
  autoReplyEnabled: boolean;
  keywordResponses: { [key: string]: string };
}

// Validate WhatsApp webhook signature
function validateWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
  try {
    const webhookSecret = whatsappWebhookSecret();
    if (!webhookSecret) {
      console.warn('WhatsApp webhook secret not configured');
      return true; // Allow if no secret is configured
    }

    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(timestamp + payload)
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.error('Webhook signature validation error:', error);
    return false;
  }
}

// Handle incoming WhatsApp messages and generate auto-replies
export const handleWhatsAppWebhook = api<WhatsAppWebhookRequest & WhatsAppWebhookParams, AutoReplyResponse>(
  { method: "POST", path: "/catalog/whatsapp/webhook", expose: true },
  async (req) => {
    try {
      // Validate webhook signature if provided
      if (req.signature && req.timestamp) {
        const payload = JSON.stringify({
          from: req.from,
          to: req.to,
          message: req.message,
          messageType: req.messageType,
          timestamp: req.timestamp
        });
        
        if (!validateWebhookSignature(payload, req.signature, req.timestamp)) {
          console.error('Invalid webhook signature');
          return {
            reply: "Webhook signature validation failed"
          };
        }
      }

      const message = req.message.toLowerCase().trim();
      
      // Get WhatsApp settings
      const settings = await getWhatsAppSettings();
      
      if (!settings.autoReplyEnabled) {
        return {
          reply: "Terima kasih telah menghubungi kami. Tim kami akan segera merespons pesan Anda."
        };
      }

      // Check for specific keywords
      const response = await processKeywordResponse(message, settings);
      if (response) {
        return response;
      }

      // Check if it's business hours
      const isBusinessHours = checkBusinessHours();
      if (!isBusinessHours) {
        return {
          reply: `${settings.welcomeMessage}\n\n⏰ *JAM OPERASIONAL*\n${settings.businessHours}\n\nKami akan merespons pesan Anda pada jam operasional. Terima kasih!`,
          quickReplies: ["📱 Lihat Katalog", "📞 Kontak Darurat", "ℹ️ Info Toko"]
        };
      }

      // Default welcome response with menu
      return {
        reply: `${settings.welcomeMessage}\n\n🏪 *MENU LAYANAN:*\n\n1️⃣ Lihat Katalog Produk\n2️⃣ Cara Pemesanan\n3️⃣ Cek Status Pesanan\n4️⃣ Info Pengiriman\n5️⃣ Hubungi Customer Service\n\nKetik nomor atau pilih menu di bawah ini 👇`,
        quickReplies: ["📱 Katalog", "🛒 Cara Pesan", "📦 Status Pesanan", "🚚 Info Kirim", "👨‍💼 CS"]
      };

    } catch (error) {
      console.error('WhatsApp webhook error:', error);
      return {
        reply: "Maaf, terjadi kesalahan sistem. Silakan coba lagi atau hubungi customer service kami."
      };
    }
  }
);

// Process keyword-based responses
async function processKeywordResponse(message: string, settings: WhatsAppSettings): Promise<AutoReplyResponse | null> {
  // Check greeting keywords
  if (["halo", "hai", "hello", "hi", "selamat"].some(keyword => message.includes(keyword))) {
    return {
      reply: `${settings.welcomeMessage}\n\nAda yang bisa kami bantu? 😊`,
      quickReplies: ["📱 Lihat Katalog", "🛒 Cara Pesan", "📞 Hubungi CS"]
    };
  }

  // Check catalog keywords
  if (["katalog", "produk", "barang", "menu", "daftar"].some(keyword => message.includes(keyword))) {
    const catalogUrl = `${process.env.FRONTEND_URL || 'https://smart-kalkulator-app-d2hcstk82vjt19pmedh0.lp.dev'}/catalog`;
    return {
      reply: `📱 *KATALOG PRODUK*\n\nLihat semua produk kami di:\n${catalogUrl}\n\n🛒 Untuk pemesanan cepat, kirim pesan dengan format:\n*PESAN [Nama Produk] [Jumlah]*\n\nContoh: PESAN Beras 5kg 2`,
      quickReplies: ["🛒 Cara Pesan", "📞 Hubungi CS"]
    };
  }

  // Check order status keywords
  if (["status", "pesanan", "order", "cek"].some(keyword => message.includes(keyword))) {
    return {
      reply: `📦 *CEK STATUS PESANAN*\n\nUntuk mengecek status pesanan, kirim pesan dengan format:\n*STATUS [Nomor Pesanan]*\n\nContoh: STATUS WA-1734567890123\n\nAtau hubungi customer service kami untuk bantuan lebih lanjut.`,
      quickReplies: ["👨‍💼 Hubungi CS", "📱 Lihat Katalog"]
    };
  }

  // Check shipping info keywords
  if (["kirim", "pengiriman", "ongkir", "antar", "delivery"].some(keyword => message.includes(keyword))) {
    const settings = await catalogDB.queryRow<{
      delivery_fee: number;
      min_order_amount: number;
    }>`SELECT delivery_fee, min_order_amount FROM catalog_settings LIMIT 1`;

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount);
    };

    return {
      reply: `🚚 *INFO PENGIRIMAN*\n\n📍 Area Pengiriman: Seluruh kota\n⏰ Waktu Pengiriman: 1-2 hari kerja\n💰 Ongkos Kirim: ${formatCurrency(settings?.delivery_fee || 10000)}\n\n🎉 *GRATIS ONGKIR* untuk pembelian minimal ${formatCurrency(settings?.min_order_amount || 100000)}!`,
      quickReplies: ["🛒 Pesan Sekarang", "📱 Lihat Katalog"]
    };
  }

  // Check contact/customer service keywords
  if (["cs", "customer service", "bantuan", "help", "kontak"].some(keyword => message.includes(keyword))) {
    return {
      reply: `👨‍💼 *CUSTOMER SERVICE*\n\n📞 Telepon: 0812-3456-7890\n📧 Email: cs@tokoanda.com\n⏰ Jam Layanan: Senin-Sabtu 08:00-17:00\n\nTim CS kami siap membantu Anda! 😊`,
      quickReplies: ["📱 Lihat Katalog", "🛒 Cara Pesan"]
    };
  }

  // Check order keywords
  if (message.startsWith("pesan ") || message.startsWith("order ")) {
    return {
      reply: `🛒 *CARA PEMESANAN*\n\n1️⃣ Kirim pesan dengan format:\n*PESAN [Nama Produk] [Jumlah]*\n\n2️⃣ Kami akan konfirmasi ketersediaan dan total harga\n\n3️⃣ Konfirmasi alamat pengiriman\n\n4️⃣ Lakukan pembayaran\n\n5️⃣ Kirim bukti transfer\n\n6️⃣ Pesanan akan dikirim!\n\nContoh: PESAN Beras 5kg 2`,
      quickReplies: ["📱 Lihat Katalog", "👨‍💼 Hubungi CS"]
    };
  }

  // Check for custom keyword responses
  for (const [keyword, response] of Object.entries(settings.keywordResponses)) {
    if (message.includes(keyword.toLowerCase())) {
      return { reply: response };
    }
  }

  return null;
}

// Check if current time is within business hours
function checkBusinessHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Business hours: Monday-Saturday 8AM-5PM
  return day >= 1 && day <= 6 && hour >= 8 && hour < 17;
}

// Get WhatsApp settings
async function getWhatsAppSettings(): Promise<WhatsAppSettings> {
  try {
    const settings = await catalogDB.queryRow<{
      store_name: string;
    }>`SELECT store_name FROM catalog_settings LIMIT 1`;

    const storeName = settings?.store_name || "Toko Kami";

    return {
      welcomeMessage: `Halo! Selamat datang di *${storeName}* 👋\n\nTerima kasih telah menghubungi kami!`,
      businessHours: "Senin - Sabtu: 08:00 - 17:00\nMinggu: Libur",
      autoReplyEnabled: true,
      keywordResponses: {
        "harga": "Untuk info harga terbaru, silakan lihat katalog kami atau hubungi CS.",
        "promo": "Info promo terbaru akan kami bagikan melalui broadcast WhatsApp!",
        "lokasi": "Kami melayani pengiriman ke seluruh kota. Hubungi CS untuk info detail area pengiriman.",
        "pembayaran": "Metode pembayaran: Transfer Bank (BCA, Mandiri, BRI, BNI), Cash on Delivery (COD)",
        "garansi": "Semua produk bergaransi. Hubungi CS untuk klaim garansi.",
        "return": "Kebijakan return 7 hari. Hubungi CS untuk proses return/tukar barang."
      }
    };
  } catch (error) {
    console.error('Error getting WhatsApp settings:', error);
    return {
      welcomeMessage: "Halo! Selamat datang di toko kami 👋",
      businessHours: "Senin - Sabtu: 08:00 - 17:00",
      autoReplyEnabled: true,
      keywordResponses: {}
    };
  }
}

// Check order status via WhatsApp
export const checkOrderStatus = api(
  { method: "POST", path: "/catalog/whatsapp/check-status", expose: true },
  async (req: { orderNumber: string }): Promise<AutoReplyResponse> => {
    try {
      const order = await catalogDB.queryRow<{
        order_number: string;
        customer_name: string;
        status: string;
        total_amount: number;
        created_at: Date;
      }>`
        SELECT order_number, customer_name, status, total_amount, created_at
        FROM catalog_orders
        WHERE order_number = ${req.orderNumber}
      `;

      if (!order) {
        return {
          reply: `Maaf, pesanan dengan nomor *${req.orderNumber}* tidak ditemukan.\n\nPastikan nomor pesanan benar atau hubungi customer service kami.`,
          quickReplies: ["👨‍💼 Hubungi CS", "📱 Lihat Katalog"]
        };
      }

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(amount);
      };

      const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      const statusEmoji = {
        'pending': '⏳',
        'confirmed': '✅',
        'processing': '📦',
        'shipped': '🚚',
        'delivered': '🎉',
        'cancelled': '❌'
      };

      const statusText = {
        'pending': 'Menunggu Konfirmasi',
        'confirmed': 'Pesanan Dikonfirmasi',
        'processing': 'Sedang Diproses',
        'shipped': 'Dalam Pengiriman',
        'delivered': 'Pesanan Selesai',
        'cancelled': 'Pesanan Dibatalkan'
      };

      return {
        reply: `📦 *STATUS PESANAN*\n\nNo. Pesanan: *${order.order_number}*\nNama: ${order.customer_name}\nTanggal: ${formatDate(order.created_at)}\nTotal: ${formatCurrency(order.total_amount)}\n\nStatus: ${statusEmoji[order.status as keyof typeof statusEmoji] || '📋'} *${statusText[order.status as keyof typeof statusText] || order.status.toUpperCase()}*\n\nTerima kasih telah berbelanja dengan kami! 🙏`,
        quickReplies: ["👨‍💼 Hubungi CS", "📱 Lihat Katalog", "🛒 Pesan Lagi"]
      };

    } catch (error) {
      console.error('Error checking order status:', error);
      return {
        reply: "Maaf, terjadi kesalahan saat mengecek status pesanan. Silakan hubungi customer service kami.",
        quickReplies: ["👨‍💼 Hubungi CS"]
      };
    }
  }
);

// Send promotional broadcast message
export const sendPromoBroadcast = api(
  { method: "POST", path: "/catalog/whatsapp/send-promo", expose: true },
  async (req: { title: string; description: string; validUntil: string; discountPercent?: number }): Promise<{ message: string }> => {
    const { title, description, validUntil, discountPercent } = req;
    
    const catalogUrl = `${process.env.FRONTEND_URL || 'https://smart-kalkulator-app-d2hcstk82vjt19pmedh0.lp.dev'}/catalog`;
    
    let promoMessage = `🎉 *${title.toUpperCase()}* 🎉\n\n${description}\n\n`;
    
    if (discountPercent) {
      promoMessage += `💰 Hemat hingga *${discountPercent}%*!\n\n`;
    }
    
    promoMessage += `⏰ Berlaku sampai: *${validUntil}*\n\n📱 Lihat katalog lengkap: ${catalogUrl}\n\n🛒 Pesan sekarang juga! Ketik *KATALOG* untuk melihat produk atau langsung pesan dengan format:\n*PESAN [Nama Produk] [Jumlah]*\n\nJangan sampai terlewat! 🔥`;

    // In a real implementation, this would send to a broadcast list
    // For now, we'll return the formatted message
    return {
      message: promoMessage
    };
  }
);