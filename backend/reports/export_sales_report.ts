import { api } from "encore.dev/api";
import { salesDB } from "../sales/db";
import { catalogDB } from "../catalog/db";

export interface ExportSalesReportRequest {
  startDate: Date;
  endDate: Date;
  format: "csv" | "excel" | "pdf";
  includeCharts?: boolean;
}

export interface ExportResponse {
  data: string;
  filename: string;
  contentType: string;
}

// Export comprehensive sales report in various formats
export const exportSalesReport = api(
  { method: "POST", path: "/reports/export/sales", expose: true },
  async (req: ExportSalesReportRequest): Promise<ExportResponse> => {
    try {
      // Get comprehensive sales data
      const reportData = await generateSalesReportData(req.startDate, req.endDate);
      
      switch (req.format) {
        case "csv":
          return await generateCSVReport(reportData, req.startDate, req.endDate);
        case "excel":
          return await generateExcelReport(reportData, req.startDate, req.endDate);
        case "pdf":
          return await generatePDFReport(reportData, req.startDate, req.endDate, req.includeCharts);
        default:
          throw new Error(`Unsupported format: ${req.format}`);
      }
    } catch (error) {
      console.error('Error exporting sales report:', error);
      throw new Error(`Failed to export sales report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

async function generateSalesReportData(startDate: Date, endDate: Date) {
  // Get POS transactions
  const posTransactions = await salesDB.queryAll<{
    transaction_number: string;
    customer_name: string | null;
    total_amount: number;
    payment_method: string;
    created_at: Date;
  }>`
    SELECT transaction_number, customer_name, total_amount, payment_method, created_at
    FROM sales_transactions
    WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    AND status = 'completed'
    ORDER BY created_at DESC
  `;

  // Get catalog orders
  const catalogOrders = await catalogDB.queryAll<{
    order_number: string;
    customer_name: string;
    total_amount: number;
    payment_method: string;
    created_at: Date;
  }>`
    SELECT order_number, customer_name, total_amount, payment_method, created_at
    FROM catalog_orders
    WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    AND order_status = 'completed'
    ORDER BY created_at DESC
  `;

  // Get top products
  const posProducts = await salesDB.queryAll<{
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }>`
    SELECT 
      si.product_name,
      SUM(si.quantity) as total_quantity,
      SUM(si.total_price) as total_revenue
    FROM sales_items si
    JOIN sales_transactions st ON si.transaction_id = st.id
    WHERE st.created_at >= ${startDate} AND st.created_at <= ${endDate}
    AND st.status = 'completed'
    GROUP BY si.product_name
    ORDER BY total_revenue DESC
    LIMIT 20
  `;

  const catalogProducts = await catalogDB.queryAll<{
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }>`
    SELECT 
      coi.product_name,
      SUM(coi.quantity) as total_quantity,
      SUM(coi.total_price) as total_revenue
    FROM catalog_order_items coi
    JOIN catalog_orders co ON coi.order_id = co.id
    WHERE co.created_at >= ${startDate} AND co.created_at <= ${endDate}
    AND co.order_status = 'completed'
    GROUP BY coi.product_name
    ORDER BY total_revenue DESC
    LIMIT 20
  `;

  return {
    posTransactions,
    catalogOrders,
    posProducts,
    catalogProducts
  };
}

async function generateCSVReport(data: any, startDate: Date, endDate: Date): Promise<ExportResponse> {
  let csvContent = `LAPORAN PENJUALAN\n`;
  csvContent += `Periode: ${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}\n\n`;

  // Summary
  const totalPosRevenue = data.posTransactions.reduce((sum: number, t: any) => sum + t.total_amount, 0);
  const totalCatalogRevenue = data.catalogOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0);
  const totalRevenue = totalPosRevenue + totalCatalogRevenue;
  const totalTransactions = data.posTransactions.length + data.catalogOrders.length;

  csvContent += `RINGKASAN\n`;
  csvContent += `Total Pendapatan,${totalRevenue.toLocaleString('id-ID')}\n`;
  csvContent += `Total Transaksi,${totalTransactions}\n`;
  csvContent += `Rata-rata Nilai Order,${totalTransactions > 0 ? (totalRevenue / totalTransactions).toLocaleString('id-ID') : 0}\n`;
  csvContent += `Pendapatan POS,${totalPosRevenue.toLocaleString('id-ID')}\n`;
  csvContent += `Pendapatan Katalog Online,${totalCatalogRevenue.toLocaleString('id-ID')}\n\n`;

  // POS Transactions
  csvContent += `TRANSAKSI POS\n`;
  csvContent += `No. Transaksi,Pelanggan,Total,Pembayaran,Tanggal\n`;
  data.posTransactions.forEach((t: any) => {
    csvContent += `${t.transaction_number},"${t.customer_name || '-'}",${t.total_amount},${t.payment_method},${new Date(t.created_at).toLocaleDateString('id-ID')}\n`;
  });

  csvContent += `\nPESANAN KATALOG ONLINE\n`;
  csvContent += `No. Pesanan,Pelanggan,Total,Pembayaran,Tanggal\n`;
  data.catalogOrders.forEach((o: any) => {
    csvContent += `${o.order_number},"${o.customer_name}",${o.total_amount},${o.payment_method},${new Date(o.created_at).toLocaleDateString('id-ID')}\n`;
  });

  // Top Products
  csvContent += `\nPRODUK TERLARIS\n`;
  csvContent += `Nama Produk,Qty Terjual,Total Pendapatan\n`;
  
  const productMap = new Map();
  [...data.posProducts, ...data.catalogProducts].forEach((p: any) => {
    const existing = productMap.get(p.product_name) || { quantity: 0, revenue: 0 };
    productMap.set(p.product_name, {
      quantity: existing.quantity + p.total_quantity,
      revenue: existing.revenue + p.total_revenue
    });
  });

  Array.from(productMap.entries())
    .sort((a: any, b: any) => b[1].revenue - a[1].revenue)
    .slice(0, 10)
    .forEach(([name, data]: any) => {
      csvContent += `"${name}",${data.quantity},${data.revenue.toLocaleString('id-ID')}\n`;
    });

  const filename = `laporan-penjualan-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.csv`;

  return {
    data: csvContent,
    filename,
    contentType: 'text/csv'
  };
}

async function generateExcelReport(data: any, startDate: Date, endDate: Date): Promise<ExportResponse> {
  // For a basic implementation, we'll use CSV with Excel-friendly formatting
  const csvData = await generateCSVReport(data, startDate, endDate);
  
  return {
    data: csvData.data,
    filename: csvData.filename.replace('.csv', '.xlsx'),
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
}

async function generatePDFReport(data: any, startDate: Date, endDate: Date, includeCharts: boolean = false): Promise<ExportResponse> {
  // Generate HTML content that can be converted to PDF
  const totalPosRevenue = data.posTransactions.reduce((sum: number, t: any) => sum + t.total_amount, 0);
  const totalCatalogRevenue = data.catalogOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0);
  const totalRevenue = totalPosRevenue + totalCatalogRevenue;
  const totalTransactions = data.posTransactions.length + data.catalogOrders.length;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Laporan Penjualan</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .summary-item { padding: 10px; background: white; border-radius: 3px; }
        .summary-item strong { color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .currency { text-align: right; }
        .page-break { page-break-before: always; }
        h2 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>LAPORAN PENJUALAN</h1>
        <p>Periode: ${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}</p>
        <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</p>
      </div>

      <div class="summary">
        <h2>Ringkasan Penjualan</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <strong>Total Pendapatan:</strong><br>
            Rp ${totalRevenue.toLocaleString('id-ID')}
          </div>
          <div class="summary-item">
            <strong>Total Transaksi:</strong><br>
            ${totalTransactions} transaksi
          </div>
          <div class="summary-item">
            <strong>Rata-rata Nilai Order:</strong><br>
            Rp ${totalTransactions > 0 ? (totalRevenue / totalTransactions).toLocaleString('id-ID') : 0}
          </div>
          <div class="summary-item">
            <strong>Pendapatan POS:</strong><br>
            Rp ${totalPosRevenue.toLocaleString('id-ID')}
          </div>
          <div class="summary-item">
            <strong>Pendapatan Online:</strong><br>
            Rp ${totalCatalogRevenue.toLocaleString('id-ID')}
          </div>
          <div class="summary-item">
            <strong>Persentase Online:</strong><br>
            ${totalRevenue > 0 ? ((totalCatalogRevenue / totalRevenue) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      <h2>Produk Terlaris</h2>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Produk</th>
            <th>Qty Terjual</th>
            <th>Total Pendapatan</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Add top products
  const productMap = new Map();
  [...data.posProducts, ...data.catalogProducts].forEach((p: any) => {
    const existing = productMap.get(p.product_name) || { quantity: 0, revenue: 0 };
    productMap.set(p.product_name, {
      quantity: existing.quantity + p.total_quantity,
      revenue: existing.revenue + p.total_revenue
    });
  });

  let htmlProducts = '';
  Array.from(productMap.entries())
    .sort((a: any, b: any) => b[1].revenue - a[1].revenue)
    .slice(0, 10)
    .forEach(([name, data]: any, index: number) => {
      htmlProducts += `
        <tr>
          <td>${index + 1}</td>
          <td>${name}</td>
          <td>${data.quantity}</td>
          <td class="currency">Rp ${data.revenue.toLocaleString('id-ID')}</td>
        </tr>
      `;
    });

  let finalHtml = htmlContent + htmlProducts + `
        </tbody>
      </table>
    </body>
    </html>
  `;

  const filename = `laporan-penjualan-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.html`;

  return {
    data: finalHtml,
    filename,
    contentType: 'text/html'
  };
}

// Export inventory report
export const exportInventoryReport = api(
  { method: "POST", path: "/reports/export/inventory", expose: true },
  async (req: { format: "csv" | "excel" | "pdf" }): Promise<ExportResponse> => {
    try {
      // Get products with stock information
      const products = await salesDB.queryAll<{
        name: string;
        category: string;
        stock_quantity: number;
        minimum_stock: number;
        buying_price: number;
        selling_price: number;
        is_active: boolean;
      }>`
        SELECT name, category, stock_quantity, minimum_stock, buying_price, selling_price, is_active
        FROM products
        ORDER BY name
      `;

      const lowStockProducts = products.filter(p => p.stock_quantity <= p.minimum_stock);
      const outOfStockProducts = products.filter(p => p.stock_quantity === 0);
      const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.buying_price), 0);

      let content = `LAPORAN INVENTORI\n`;
      content += `Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\n`;
      content += `RINGKASAN\n`;
      content += `Total Produk,${products.length}\n`;
      content += `Produk Aktif,${products.filter(p => p.is_active).length}\n`;
      content += `Stok Menipis,${lowStockProducts.length}\n`;
      content += `Stok Habis,${outOfStockProducts.length}\n`;
      content += `Nilai Total Inventori,${totalInventoryValue.toLocaleString('id-ID')}\n\n`;

      content += `DETAIL PRODUK\n`;
      content += `Nama,Kategori,Stok,Min. Stok,Harga Beli,Harga Jual,Status,Nilai Stok\n`;
      
      products.forEach(p => {
        const stockValue = p.stock_quantity * p.buying_price;
        content += `"${p.name}","${p.category}",${p.stock_quantity},${p.minimum_stock},${p.buying_price},${p.selling_price},${p.is_active ? 'Aktif' : 'Nonaktif'},${stockValue.toLocaleString('id-ID')}\n`;
      });

      if (lowStockProducts.length > 0) {
        content += `\nPRODUK STOK MENIPIS\n`;
        content += `Nama,Stok Saat Ini,Min. Stok,Selisih\n`;
        lowStockProducts.forEach(p => {
          content += `"${p.name}",${p.stock_quantity},${p.minimum_stock},${p.minimum_stock - p.stock_quantity}\n`;
        });
      }

      const filename = `laporan-inventori-${new Date().toISOString().split('T')[0]}.csv`;

      return {
        data: content,
        filename,
        contentType: 'text/csv'
      };

    } catch (error) {
      console.error('Error exporting inventory report:', error);
      throw new Error(`Failed to export inventory report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Export financial report
export const exportFinancialReport = api(
  { method: "POST", path: "/reports/export/financial", expose: true },
  async (req: { startDate: Date; endDate: Date; format: "csv" | "excel" | "pdf" }): Promise<ExportResponse> => {
    try {
      // Get revenue data
      const posRevenue = await salesDB.queryAll<{
        total_amount: number;
        created_at: Date;
      }>`
        SELECT total_amount, created_at
        FROM sales_transactions
        WHERE created_at >= ${req.startDate} AND created_at <= ${req.endDate}
        AND status = 'completed'
      `;

      const catalogRevenue = await catalogDB.queryAll<{
        total_amount: number;
        created_at: Date;
      }>`
        SELECT total_amount, created_at
        FROM catalog_orders
        WHERE created_at >= ${req.startDate} AND created_at <= ${req.endDate}
        AND order_status = 'completed'
      `;

      // Calculate financial metrics
      const totalRevenue = posRevenue.reduce((sum, t) => sum + t.total_amount, 0) + 
                          catalogRevenue.reduce((sum, o) => sum + o.total_amount, 0);

      let content = `LAPORAN KEUANGAN\n`;
      content += `Periode: ${req.startDate.toLocaleDateString('id-ID')} - ${req.endDate.toLocaleDateString('id-ID')}\n\n`;
      content += `PENDAPATAN\n`;
      content += `Penjualan POS,${posRevenue.reduce((sum, t) => sum + t.total_amount, 0).toLocaleString('id-ID')}\n`;
      content += `Penjualan Online,${catalogRevenue.reduce((sum, o) => sum + o.total_amount, 0).toLocaleString('id-ID')}\n`;
      content += `Total Pendapatan,${totalRevenue.toLocaleString('id-ID')}\n\n`;

      content += `DETAIL HARIAN\n`;
      content += `Tanggal,Pendapatan POS,Pendapatan Online,Total Harian\n`;

      // Group by date
      const dailyData = new Map();
      posRevenue.forEach(t => {
        const date = t.created_at.toISOString().split('T')[0];
        const existing = dailyData.get(date) || { pos: 0, catalog: 0 };
        dailyData.set(date, { ...existing, pos: existing.pos + t.total_amount });
      });

      catalogRevenue.forEach(o => {
        const date = o.created_at.toISOString().split('T')[0];
        const existing = dailyData.get(date) || { pos: 0, catalog: 0 };
        dailyData.set(date, { ...existing, catalog: existing.catalog + o.total_amount });
      });

      Array.from(dailyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, data]: any) => {
          const total = data.pos + data.catalog;
          content += `${new Date(date).toLocaleDateString('id-ID')},${data.pos.toLocaleString('id-ID')},${data.catalog.toLocaleString('id-ID')},${total.toLocaleString('id-ID')}\n`;
        });

      const filename = `laporan-keuangan-${req.startDate.toISOString().split('T')[0]}-${req.endDate.toISOString().split('T')[0]}.csv`;

      return {
        data: content,
        filename,
        contentType: 'text/csv'
      };

    } catch (error) {
      console.error('Error exporting financial report:', error);
      throw new Error(`Failed to export financial report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);