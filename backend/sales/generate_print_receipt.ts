import { api } from "encore.dev/api";
import { salesDB } from "./db";

export interface PrintReceiptRequest {
  transactionId: number;
  format: "thermal" | "a4" | "html";
  copies?: number;
}

export interface PrintReceiptResponse {
  content: string;
  contentType: string;
  filename: string;
}

// Generate print-ready receipts in various formats
export const generatePrintReceipt = api(
  { method: "POST", path: "/sales/print-receipt", expose: true },
  async (req: PrintReceiptRequest): Promise<PrintReceiptResponse> => {
    try {
      // Get transaction details
      const transaction = await salesDB.queryRow<{
        id: number;
        transaction_number: string;
        customer_name: string | null;
        customer_phone: string | null;
        subtotal: number;
        tax_amount: number;
        discount_amount: number;
        total_amount: number;
        payment_method: string;
        payment_amount: number;
        change_amount: number;
        notes: string | null;
        created_at: Date;
        cashier_name: string | null;
      }>`
        SELECT id, transaction_number, customer_name, customer_phone,
               subtotal, tax_amount, discount_amount, total_amount,
               payment_method, payment_amount, change_amount, notes,
               created_at, cashier_name
        FROM sales_transactions
        WHERE id = ${req.transactionId}
      `;

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      // Get transaction items
      const items = await salesDB.queryAll<{
        product_name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }>`
        SELECT product_name, quantity, unit_price, total_price
        FROM sales_items
        WHERE transaction_id = ${req.transactionId}
        ORDER BY id
      `;

      // Get store settings
      const settings = await salesDB.queryRow<{
        store_name: string;
        store_address: string;
        store_phone: string;
        tax_rate: number;
      }>`
        SELECT store_name, store_address, store_phone, tax_rate
        FROM settings
        LIMIT 1
      `;

      const storeInfo = settings || {
        store_name: "Toko Anda",
        store_address: "Alamat Toko",
        store_phone: "021-1234567",
        tax_rate: 0
      };

      switch (req.format) {
        case "thermal":
          return generateThermalReceipt(transaction, items, storeInfo);
        case "a4":
          return generateA4Receipt(transaction, items, storeInfo);
        case "html":
          return generateHTMLReceipt(transaction, items, storeInfo);
        default:
          throw new Error(`Unsupported format: ${req.format}`);
      }

    } catch (error) {
      console.error('Error generating print receipt:', error);
      throw new Error(`Failed to generate receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

function generateThermalReceipt(transaction: any, items: any[], storeInfo: any): PrintReceiptResponse {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount).replace(/\s/g, '');
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const centerText = (text: string, width: number = 32) => {
    const padding = Math.max(0, width - text.length) / 2;
    return ' '.repeat(Math.floor(padding)) + text + ' '.repeat(Math.ceil(padding));
  };

  const rightAlign = (text: string, width: number = 32) => {
    return text.padStart(width);
  };

  let receipt = '';
  
  // Header
  receipt += centerText(storeInfo.store_name.toUpperCase()) + '\n';
  receipt += centerText(storeInfo.store_address) + '\n';
  receipt += centerText(`Telp: ${storeInfo.store_phone}`) + '\n';
  receipt += '='.repeat(32) + '\n';
  receipt += centerText('STRUK PEMBELIAN') + '\n';
  receipt += '='.repeat(32) + '\n';
  
  // Transaction info
  receipt += `No: ${transaction.transaction_number}\n`;
  receipt += `Tgl: ${formatDate(transaction.created_at)}\n`;
  if (transaction.customer_name) {
    receipt += `Pelanggan: ${transaction.customer_name}\n`;
  }
  if (transaction.cashier_name) {
    receipt += `Kasir: ${transaction.cashier_name}\n`;
  }
  receipt += '-'.repeat(32) + '\n';

  // Items
  receipt += 'Item                 Qty  Harga\n';
  receipt += '-'.repeat(32) + '\n';
  
  items.forEach(item => {
    const itemName = item.product_name.length > 20 ? 
      item.product_name.substring(0, 17) + '...' : 
      item.product_name;
    
    receipt += itemName.padEnd(20) + '\n';
    receipt += ` ${item.quantity}x${formatCurrency(item.unit_price)}`.padEnd(20) + 
               rightAlign(formatCurrency(item.total_price), 12) + '\n';
  });

  receipt += '-'.repeat(32) + '\n';

  // Totals
  receipt += `Subtotal:`.padEnd(20) + rightAlign(formatCurrency(transaction.subtotal), 12) + '\n';
  
  if (transaction.discount_amount > 0) {
    receipt += `Diskon:`.padEnd(20) + rightAlign(`-${formatCurrency(transaction.discount_amount)}`, 12) + '\n';
  }
  
  if (transaction.tax_amount > 0) {
    receipt += `Pajak:`.padEnd(20) + rightAlign(formatCurrency(transaction.tax_amount), 12) + '\n';
  }
  
  receipt += '='.repeat(32) + '\n';
  receipt += `TOTAL:`.padEnd(20) + rightAlign(formatCurrency(transaction.total_amount), 12) + '\n';
  receipt += '='.repeat(32) + '\n';

  // Payment
  receipt += `${transaction.payment_method}:`.padEnd(20) + rightAlign(formatCurrency(transaction.payment_amount), 12) + '\n';
  if (transaction.change_amount > 0) {
    receipt += `Kembalian:`.padEnd(20) + rightAlign(formatCurrency(transaction.change_amount), 12) + '\n';
  }

  receipt += '\n';
  receipt += centerText('TERIMA KASIH') + '\n';
  receipt += centerText('SELAMAT BERBELANJA KEMBALI') + '\n';
  receipt += '\n';
  receipt += centerText(`Dicetak: ${new Date().toLocaleString('id-ID')}`);

  return {
    content: receipt,
    contentType: 'text/plain',
    filename: `struk-${transaction.transaction_number}.txt`
  };
}

function generateA4Receipt(transaction: any, items: any[], storeInfo: any): PrintReceiptResponse {
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

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Struk Pembelian - ${transaction.transaction_number}</title>
      <style>
        @page { 
          size: A4; 
          margin: 20mm; 
        }
        @media print {
          .no-print { display: none; }
          body { margin: 0; }
        }
        body {
          font-family: 'Courier New', monospace;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .store-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .store-info {
          font-size: 14px;
          margin-bottom: 5px;
        }
        .receipt-title {
          font-size: 18px;
          font-weight: bold;
          margin-top: 15px;
        }
        .transaction-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
          padding: 15px;
          background: #f9f9f9;
          border: 1px solid #ddd;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th,
        .items-table td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
        }
        .items-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .currency {
          text-align: right;
        }
        .totals {
          margin-top: 20px;
          padding: 15px;
          border: 2px solid #000;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .total-final {
          font-size: 18px;
          font-weight: bold;
          border-top: 1px solid #000;
          padding-top: 10px;
          margin-top: 10px;
        }
        .payment-info {
          margin-top: 20px;
          padding: 15px;
          background: #f0f8ff;
          border: 1px solid #0066cc;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
        }
        .print-button {
          margin-bottom: 20px;
          text-align: center;
        }
        .print-button button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="print-button no-print">
        <button onclick="window.print()">🖨️ Print Struk</button>
      </div>

      <div class="header">
        <div class="store-name">${storeInfo.store_name}</div>
        <div class="store-info">${storeInfo.store_address}</div>
        <div class="store-info">Telp: ${storeInfo.store_phone}</div>
        <div class="receipt-title">STRUK PEMBELIAN</div>
      </div>

      <div class="transaction-info">
        <div>
          <div class="info-item">
            <span><strong>No. Transaksi:</strong></span>
            <span>${transaction.transaction_number}</span>
          </div>
          <div class="info-item">
            <span><strong>Tanggal:</strong></span>
            <span>${formatDate(transaction.created_at)}</span>
          </div>
          ${transaction.customer_name ? `
          <div class="info-item">
            <span><strong>Pelanggan:</strong></span>
            <span>${transaction.customer_name}</span>
          </div>
          ` : ''}
        </div>
        <div>
          ${transaction.cashier_name ? `
          <div class="info-item">
            <span><strong>Kasir:</strong></span>
            <span>${transaction.cashier_name}</span>
          </div>
          ` : ''}
          <div class="info-item">
            <span><strong>Metode Bayar:</strong></span>
            <span>${transaction.payment_method}</span>
          </div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Produk</th>
            <th>Qty</th>
            <th>Harga Satuan</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
  `;

  let itemsHtml = '';
  items.forEach((item, index) => {
    itemsHtml += `
      <tr>
        <td>${index + 1}</td>
        <td>${item.product_name}</td>
        <td>${item.quantity}</td>
        <td class="currency">${formatCurrency(item.unit_price)}</td>
        <td class="currency">${formatCurrency(item.total_price)}</td>
      </tr>
    `;
  });

  const footerHtml = `
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(transaction.subtotal)}</span>
        </div>
        ${transaction.discount_amount > 0 ? `
        <div class="totals-row">
          <span>Diskon:</span>
          <span>-${formatCurrency(transaction.discount_amount)}</span>
        </div>
        ` : ''}
        ${transaction.tax_amount > 0 ? `
        <div class="totals-row">
          <span>Pajak:</span>
          <span>${formatCurrency(transaction.tax_amount)}</span>
        </div>
        ` : ''}
        <div class="totals-row total-final">
          <span>TOTAL:</span>
          <span>${formatCurrency(transaction.total_amount)}</span>
        </div>
      </div>

      <div class="payment-info">
        <div class="totals-row">
          <span><strong>Pembayaran (${transaction.payment_method}):</strong></span>
          <span><strong>${formatCurrency(transaction.payment_amount)}</strong></span>
        </div>
        ${transaction.change_amount > 0 ? `
        <div class="totals-row">
          <span><strong>Kembalian:</strong></span>
          <span><strong>${formatCurrency(transaction.change_amount)}</strong></span>
        </div>
        ` : ''}
      </div>

      ${transaction.notes ? `
      <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffc107;">
        <strong>Catatan:</strong> ${transaction.notes}
      </div>
      ` : ''}

      <div class="footer">
        <div style="font-size: 16px; margin-bottom: 10px;">
          <strong>TERIMA KASIH</strong>
        </div>
        <div>Selamat berbelanja kembali!</div>
        <div style="margin-top: 15px; font-size: 10px;">
          Dicetak pada: ${new Date().toLocaleString('id-ID')}
        </div>
      </div>

      <script>
        // Auto print when loaded in print mode
        if (window.location.search.includes('print=true')) {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  return {
    content: htmlContent + itemsHtml + footerHtml,
    contentType: 'text/html',
    filename: `struk-${transaction.transaction_number}.html`
  };
}

function generateHTMLReceipt(transaction: any, items: any[], storeInfo: any): PrintReceiptResponse {
  // Generate a simple HTML version for web display
  return generateA4Receipt(transaction, items, storeInfo);
}