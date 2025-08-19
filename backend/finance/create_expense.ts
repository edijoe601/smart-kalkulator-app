import { api } from "encore.dev/api";
import { financeDB } from "./db";

export interface CreateExpenseRequest {
  categoryId: number;
  description: string;
  amount: number;
  expenseDate: Date;
  paymentMethod?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface Expense {
  id: number;
  categoryId: number;
  categoryName: string;
  description: string;
  amount: number;
  expenseDate: Date;
  paymentMethod?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new expense record.
export const createExpense = api<CreateExpenseRequest, Expense>(
  { expose: true, method: "POST", path: "/finance/expenses" },
  async (req) => {
    const tx = await financeDB.begin();
    
    try {
      // Create expense
      const expenseRow = await tx.queryRow<{
        id: number;
        category_id: number;
        description: string;
        amount: number;
        expense_date: Date;
        payment_method: string | null;
        receipt_url: string | null;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
      }>`
        INSERT INTO expenses (
          category_id, description, amount, expense_date, 
          payment_method, receipt_url, notes
        )
        VALUES (
          ${req.categoryId}, ${req.description}, ${req.amount}, ${req.expenseDate},
          ${req.paymentMethod || null}, ${req.receiptUrl || null}, ${req.notes || null}
        )
        RETURNING *
      `;

      if (!expenseRow) {
        throw new Error("Failed to create expense");
      }

      // Get category name
      const category = await tx.queryRow<{
        name: string;
      }>`SELECT name FROM expense_categories WHERE id = ${req.categoryId}`;

      // Create cash flow entry
      await tx.exec`
        INSERT INTO cash_flows (
          type, category, description, amount, transaction_date, 
          reference_id, reference_type
        )
        VALUES (
          'expense', ${category?.name || 'Unknown'}, ${req.description}, 
          ${req.amount}, ${req.expenseDate}, ${expenseRow.id}, 'expense'
        )
      `;

      await tx.commit();

      return {
        id: expenseRow.id,
        categoryId: expenseRow.category_id,
        categoryName: category?.name || 'Unknown',
        description: expenseRow.description,
        amount: expenseRow.amount,
        expenseDate: expenseRow.expense_date,
        paymentMethod: expenseRow.payment_method || undefined,
        receiptUrl: expenseRow.receipt_url || undefined,
        notes: expenseRow.notes || undefined,
        createdAt: expenseRow.created_at,
        updatedAt: expenseRow.updated_at
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
