import { api } from "encore.dev/api";
import { financeDB } from "./db";

export interface CashFlowRequest {
  startDate: Date;
  endDate: Date;
}

export interface CashFlowEntry {
  id: number;
  type: string;
  category: string;
  description: string;
  amount: number;
  transactionDate: Date;
  referenceId?: number;
  referenceType?: string;
  createdAt: Date;
}

export interface CashFlowData {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    openingBalance: number;
    closingBalance: number;
  };
  entries: CashFlowEntry[];
  dailyFlow: Array<{
    date: Date;
    income: number;
    expenses: number;
    netFlow: number;
    runningBalance: number;
  }>;
}

// Generates cash flow report for specified period.
export const getCashFlow = api<CashFlowRequest, CashFlowData>(
  { expose: true, method: "POST", path: "/finance/cash-flow" },
  async (req) => {
    // Get all cash flow entries for the period
    const entries = await financeDB.queryAll<{
      id: number;
      type: string;
      category: string;
      description: string;
      amount: number;
      transaction_date: Date;
      reference_id: number | null;
      reference_type: string | null;
      created_at: Date;
    }>`
      SELECT *
      FROM cash_flows
      WHERE transaction_date >= ${req.startDate} AND transaction_date <= ${req.endDate}
      ORDER BY transaction_date, created_at
    `;

    const totalIncome = entries
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpenses = entries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    const netCashFlow = totalIncome - totalExpenses;

    // Calculate opening balance (cash flow before start date)
    const openingBalanceResult = await financeDB.queryRow<{
      balance: number;
    }>`
      SELECT COALESCE(
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0
      ) as balance
      FROM cash_flows
      WHERE transaction_date < ${req.startDate}
    `;

    const openingBalance = openingBalanceResult?.balance || 0;
    const closingBalance = openingBalance + netCashFlow;

    // Generate daily cash flow
    const dailyFlow = [];
    const startDate = new Date(req.startDate);
    const endDate = new Date(req.endDate);
    let runningBalance = openingBalance;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      const dailyEntries = entries.filter(e => 
        e.transaction_date.toISOString().split('T')[0] === dateStr
      );

      const dailyIncome = dailyEntries
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);

      const dailyExpenses = dailyEntries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);

      const dailyNetFlow = dailyIncome - dailyExpenses;
      runningBalance += dailyNetFlow;

      dailyFlow.push({
        date: new Date(d),
        income: dailyIncome,
        expenses: dailyExpenses,
        netFlow: dailyNetFlow,
        runningBalance
      });
    }

    return {
      period: {
        startDate: req.startDate,
        endDate: req.endDate
      },
      summary: {
        totalIncome,
        totalExpenses,
        netCashFlow,
        openingBalance,
        closingBalance
      },
      entries: entries.map(e => ({
        id: e.id,
        type: e.type,
        category: e.category,
        description: e.description,
        amount: e.amount,
        transactionDate: e.transaction_date,
        referenceId: e.reference_id || undefined,
        referenceType: e.reference_type || undefined,
        createdAt: e.created_at
      })),
      dailyFlow
    };
  }
);
