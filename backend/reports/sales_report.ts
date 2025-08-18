import { api } from "encore.dev/api";
import { salesDB } from "../sales/db";
import { catalogDB } from "../catalog/db";

export interface SalesReportRequest {
  startDate: Date;
  endDate: Date;
  channel?: string;
}

export interface SalesReportData {
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  topProducts: Array<{
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  dailySales: Array<{
    date: Date;
    revenue: number;
    transactions: number;
  }>;
  channelBreakdown: Array<{
    channel: string;
    revenue: number;
    transactions: number;
  }>;
}

// Generates sales report for specified date range.
export const getSalesReport = api<SalesReportRequest, SalesReportData>(
  { expose: true, method: "POST", path: "/reports/sales" },
  async (req) => {
    // Get POS transactions
    const posTransactions = await salesDB.queryAll<{
      total_amount: number;
      created_at: Date;
    }>`
      SELECT total_amount, created_at
      FROM sales_transactions
      WHERE created_at >= ${req.startDate} AND created_at <= ${req.endDate}
      AND status = 'completed'
    `;

    // Get catalog orders
    const catalogOrders = await catalogDB.queryAll<{
      total_amount: number;
      created_at: Date;
    }>`
      SELECT total_amount, created_at
      FROM catalog_orders
      WHERE created_at >= ${req.startDate} AND created_at <= ${req.endDate}
      AND order_status = 'completed'
    `;

    // Calculate totals
    const posRevenue = posTransactions.reduce((sum, t) => sum + t.total_amount, 0);
    const catalogRevenue = catalogOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const totalRevenue = posRevenue + catalogRevenue;
    const totalTransactions = posTransactions.length + catalogOrders.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Get top products from POS
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
      WHERE st.created_at >= ${req.startDate} AND st.created_at <= ${req.endDate}
      AND st.status = 'completed'
      GROUP BY si.product_name
      ORDER BY total_revenue DESC
      LIMIT 10
    `;

    // Get top products from catalog
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
      WHERE co.created_at >= ${req.startDate} AND co.created_at <= ${req.endDate}
      AND co.order_status = 'completed'
      GROUP BY coi.product_name
      ORDER BY total_revenue DESC
      LIMIT 10
    `;

    // Combine and sort top products
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    
    posProducts.forEach(p => {
      const existing = productMap.get(p.product_name) || { quantity: 0, revenue: 0 };
      productMap.set(p.product_name, {
        quantity: existing.quantity + p.total_quantity,
        revenue: existing.revenue + p.total_revenue
      });
    });

    catalogProducts.forEach(p => {
      const existing = productMap.get(p.product_name) || { quantity: 0, revenue: 0 };
      productMap.set(p.product_name, {
        quantity: existing.quantity + p.total_quantity,
        revenue: existing.revenue + p.total_revenue
      });
    });

    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({
        productName: name,
        quantity: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Generate daily sales data
    const dailySalesMap = new Map<string, { revenue: number; transactions: number }>();
    
    posTransactions.forEach(t => {
      const dateKey = t.created_at.toISOString().split('T')[0];
      const existing = dailySalesMap.get(dateKey) || { revenue: 0, transactions: 0 };
      dailySalesMap.set(dateKey, {
        revenue: existing.revenue + t.total_amount,
        transactions: existing.transactions + 1
      });
    });

    catalogOrders.forEach(o => {
      const dateKey = o.created_at.toISOString().split('T')[0];
      const existing = dailySalesMap.get(dateKey) || { revenue: 0, transactions: 0 };
      dailySalesMap.set(dateKey, {
        revenue: existing.revenue + o.total_amount,
        transactions: existing.transactions + 1
      });
    });

    const dailySales = Array.from(dailySalesMap.entries())
      .map(([date, data]) => ({
        date: new Date(date),
        revenue: data.revenue,
        transactions: data.transactions
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Channel breakdown
    const channelBreakdown = [
      {
        channel: 'POS/Offline',
        revenue: posRevenue,
        transactions: posTransactions.length
      },
      {
        channel: 'Online Catalog',
        revenue: catalogRevenue,
        transactions: catalogOrders.length
      }
    ];

    return {
      totalRevenue,
      totalTransactions,
      averageOrderValue,
      topProducts,
      dailySales,
      channelBreakdown
    };
  }
);
