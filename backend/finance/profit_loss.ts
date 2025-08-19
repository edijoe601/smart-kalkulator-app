import { api } from "encore.dev/api";
import { financeDB } from "./db";
import { salesDB } from "../sales/db";
import { catalogDB } from "../catalog/db";

export interface ProfitLossRequest {
  startDate: Date;
  endDate: Date;
}

export interface ProfitLossData {
  period: {
    startDate: Date;
    endDate: Date;
  };
  revenue: {
    posRevenue: number;
    catalogRevenue: number;
    totalRevenue: number;
  };
  expenses: {
    categories: Array<{
      categoryName: string;
      amount: number;
    }>;
    totalExpenses: number;
  };
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  dailyBreakdown: Array<{
    date: Date;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

// Generates profit and loss report for specified period.
export const getProfitLoss = api<ProfitLossRequest, ProfitLossData>(
  { expose: true, method: "POST", path: "/finance/profit-loss" },
  async (req) => {
    // Get POS revenue
    const posRevenue = await salesDB.queryAll<{
      total_amount: number;
      created_at: Date;
    }>`
      SELECT total_amount, created_at
      FROM sales_transactions
      WHERE created_at >= ${req.startDate} AND created_at <= ${req.endDate}
      AND status = 'completed'
    `;

    // Get catalog revenue
    const catalogRevenue = await catalogDB.queryAll<{
      total_amount: number;
      created_at: Date;
    }>`
      SELECT total_amount, created_at
      FROM catalog_orders
      WHERE created_at >= ${req.startDate} AND created_at <= ${req.endDate}
      AND order_status = 'completed'
    `;

    const posTotal = posRevenue.reduce((sum, t) => sum + t.total_amount, 0);
    const catalogTotal = catalogRevenue.reduce((sum, o) => sum + o.total_amount, 0);
    const totalRevenue = posTotal + catalogTotal;

    // Get expenses by category
    const expensesByCategory = await financeDB.queryAll<{
      category_name: string;
      total_amount: number;
    }>`
      SELECT ec.name as category_name, COALESCE(SUM(e.amount), 0) as total_amount
      FROM expense_categories ec
      LEFT JOIN expenses e ON ec.id = e.category_id 
        AND e.expense_date >= ${req.startDate} 
        AND e.expense_date <= ${req.endDate}
      WHERE ec.is_active = true
      GROUP BY ec.id, ec.name
      ORDER BY total_amount DESC
    `;

    const totalExpenses = expensesByCategory.reduce((sum, cat) => sum + cat.total_amount, 0);
    const grossProfit = totalRevenue;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Generate daily breakdown
    const dailyBreakdown = [];
    const startDate = new Date(req.startDate);
    const endDate = new Date(req.endDate);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Daily revenue
      const dailyPosRevenue = posRevenue
        .filter(t => t.created_at.toISOString().split('T')[0] === dateStr)
        .reduce((sum, t) => sum + t.total_amount, 0);
      
      const dailyCatalogRevenue = catalogRevenue
        .filter(o => o.created_at.toISOString().split('T')[0] === dateStr)
        .reduce((sum, o) => sum + o.total_amount, 0);

      const dailyRevenue = dailyPosRevenue + dailyCatalogRevenue;

      // Daily expenses
      const dailyExpenses = await financeDB.queryRow<{
        total_amount: number;
      }>`
        SELECT COALESCE(SUM(amount), 0) as total_amount
        FROM expenses
        WHERE expense_date = ${dateStr}
      `;

      const dailyExpenseAmount = dailyExpenses?.total_amount || 0;
      const dailyProfit = dailyRevenue - dailyExpenseAmount;

      dailyBreakdown.push({
        date: new Date(d),
        revenue: dailyRevenue,
        expenses: dailyExpenseAmount,
        profit: dailyProfit
      });
    }

    return {
      period: {
        startDate: req.startDate,
        endDate: req.endDate
      },
      revenue: {
        posRevenue: posTotal,
        catalogRevenue: catalogTotal,
        totalRevenue
      },
      expenses: {
        categories: expensesByCategory.map(cat => ({
          categoryName: cat.category_name,
          amount: cat.total_amount
        })),
        totalExpenses
      },
      grossProfit,
      netProfit,
      profitMargin,
      dailyBreakdown
    };
  }
);
