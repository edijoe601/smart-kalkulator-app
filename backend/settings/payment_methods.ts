import { api } from "encore.dev/api";
import { settingsDB } from "./db";

export interface PaymentMethod {
  id: number;
  name: string;
  type: "cash" | "bank_transfer" | "e_wallet" | "card" | "other";
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  qrCodeUrl?: string;
  isActive: boolean;
  displayOrder: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentMethodRequest {
  name: string;
  type: "cash" | "bank_transfer" | "e_wallet" | "card" | "other";
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  qrCodeUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
  notes?: string;
}

export interface UpdatePaymentMethodRequest {
  id: number;
  name?: string;
  type?: "cash" | "bank_transfer" | "e_wallet" | "card" | "other";
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  qrCodeUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
  notes?: string;
}

export interface PaymentSettings {
  defaultPaymentMethod: string;
  requireCustomerInfo: boolean;
  allowPartialPayment: boolean;
  maxCashAmount: number;
  minCardAmount: number;
}

// Get all payment methods
export const getPaymentMethods = api(
  { method: "GET", path: "/settings/payment-methods", expose: true },
  async (): Promise<{ paymentMethods: PaymentMethod[] }> => {
    const methods = await settingsDB.queryAll<{
      id: number;
      name: string;
      type: string;
      account_number: string | null;
      account_name: string | null;
      bank_name: string | null;
      qr_code_url: string | null;
      is_active: boolean;
      display_order: number;
      notes: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, name, type, account_number, account_name, bank_name,
             qr_code_url, is_active, display_order, notes, created_at, updated_at
      FROM payment_methods
      ORDER BY display_order ASC, name ASC
    `;

    const paymentMethods = methods.map(method => ({
      id: method.id,
      name: method.name,
      type: method.type as PaymentMethod['type'],
      accountNumber: method.account_number || undefined,
      accountName: method.account_name || undefined,
      bankName: method.bank_name || undefined,
      qrCodeUrl: method.qr_code_url || undefined,
      isActive: method.is_active,
      displayOrder: method.display_order,
      notes: method.notes || undefined,
      createdAt: method.created_at,
      updatedAt: method.updated_at
    }));

    return { paymentMethods };
  }
);

// Get active payment methods only
export const getActivePaymentMethods = api(
  { method: "GET", path: "/settings/payment-methods/active", expose: true },
  async (): Promise<{ paymentMethods: PaymentMethod[] }> => {
    const methods = await settingsDB.queryAll<{
      id: number;
      name: string;
      type: string;
      account_number: string | null;
      account_name: string | null;
      bank_name: string | null;
      qr_code_url: string | null;
      is_active: boolean;
      display_order: number;
      notes: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, name, type, account_number, account_name, bank_name,
             qr_code_url, is_active, display_order, notes, created_at, updated_at
      FROM payment_methods
      WHERE is_active = true
      ORDER BY display_order ASC, name ASC
    `;

    const paymentMethods = methods.map(method => ({
      id: method.id,
      name: method.name,
      type: method.type as PaymentMethod['type'],
      accountNumber: method.account_number || undefined,
      accountName: method.account_name || undefined,
      bankName: method.bank_name || undefined,
      qrCodeUrl: method.qr_code_url || undefined,
      isActive: method.is_active,
      displayOrder: method.display_order,
      notes: method.notes || undefined,
      createdAt: method.created_at,
      updatedAt: method.updated_at
    }));

    return { paymentMethods };
  }
);

// Create new payment method
export const createPaymentMethod = api(
  { method: "POST", path: "/settings/payment-methods", expose: true },
  async (req: CreatePaymentMethodRequest): Promise<{ paymentMethod: PaymentMethod }> => {
    const {
      name,
      type,
      accountNumber,
      accountName,
      bankName,
      qrCodeUrl,
      isActive = true,
      displayOrder = 0,
      notes
    } = req;

    const result = await settingsDB.queryRow<{
      id: number;
      name: string;
      type: string;
      account_number: string | null;
      account_name: string | null;
      bank_name: string | null;
      qr_code_url: string | null;
      is_active: boolean;
      display_order: number;
      notes: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO payment_methods (
        name, type, account_number, account_name, bank_name,
        qr_code_url, is_active, display_order, notes
      )
      VALUES (
        ${name}, ${type}, ${accountNumber}, ${accountName}, ${bankName},
        ${qrCodeUrl}, ${isActive}, ${displayOrder}, ${notes}
      )
      RETURNING id, name, type, account_number, account_name, bank_name,
                qr_code_url, is_active, display_order, notes, created_at, updated_at
    `;

    if (!result) {
      throw new Error("Failed to create payment method");
    }

    const paymentMethod = {
      id: result.id,
      name: result.name,
      type: result.type as PaymentMethod['type'],
      accountNumber: result.account_number || undefined,
      accountName: result.account_name || undefined,
      bankName: result.bank_name || undefined,
      qrCodeUrl: result.qr_code_url || undefined,
      isActive: result.is_active,
      displayOrder: result.display_order,
      notes: result.notes || undefined,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };

    return { paymentMethod };
  }
);

// Update payment method
export const updatePaymentMethod = api(
  { method: "PUT", path: "/settings/payment-methods/:id", expose: true },
  async (req: UpdatePaymentMethodRequest): Promise<{ paymentMethod: PaymentMethod }> => {
    const {
      id,
      name,
      type,
      accountNumber,
      accountName,
      bankName,
      qrCodeUrl,
      isActive,
      displayOrder,
      notes
    } = req;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      values.push(type);
    }
    if (accountNumber !== undefined) {
      updates.push(`account_number = $${paramIndex++}`);
      values.push(accountNumber);
    }
    if (accountName !== undefined) {
      updates.push(`account_name = $${paramIndex++}`);
      values.push(accountName);
    }
    if (bankName !== undefined) {
      updates.push(`bank_name = $${paramIndex++}`);
      values.push(bankName);
    }
    if (qrCodeUrl !== undefined) {
      updates.push(`qr_code_url = $${paramIndex++}`);
      values.push(qrCodeUrl);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }
    if (displayOrder !== undefined) {
      updates.push(`display_order = $${paramIndex++}`);
      values.push(displayOrder);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE payment_methods 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, type, account_number, account_name, bank_name,
                qr_code_url, is_active, display_order, notes, created_at, updated_at
    `;

    const result = await settingsDB.rawQueryRow(query, ...values);

    if (!result) {
      throw new Error("Payment method not found");
    }

    const paymentMethod = {
      id: result.id,
      name: result.name,
      type: result.type as PaymentMethod['type'],
      accountNumber: result.account_number || undefined,
      accountName: result.account_name || undefined,
      bankName: result.bank_name || undefined,
      qrCodeUrl: result.qr_code_url || undefined,
      isActive: result.is_active,
      displayOrder: result.display_order,
      notes: result.notes || undefined,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };

    return { paymentMethod };
  }
);

// Delete payment method
export const deletePaymentMethod = api(
  { method: "DELETE", path: "/settings/payment-methods/:id", expose: true },
  async (req: { id: number }): Promise<{ success: boolean }> => {
    await settingsDB.exec`
      DELETE FROM payment_methods WHERE id = ${req.id}
    `;

    return { success: true };
  }
);

// Get payment settings
export const getPaymentSettings = api(
  { method: "GET", path: "/settings/payment-settings", expose: true },
  async (): Promise<{ settings: PaymentSettings }> => {
    const result = await settingsDB.queryRow<{
      default_payment_method: string;
      require_customer_info: boolean;
      allow_partial_payment: boolean;
      max_cash_amount: number;
      min_card_amount: number;
    }>`
      SELECT default_payment_method, require_customer_info, allow_partial_payment,
             max_cash_amount, min_card_amount
      FROM store_settings
      LIMIT 1
    `;

    const settings = {
      defaultPaymentMethod: result?.default_payment_method || "Cash",
      requireCustomerInfo: result?.require_customer_info || false,
      allowPartialPayment: result?.allow_partial_payment || false,
      maxCashAmount: result?.max_cash_amount || 10000000,
      minCardAmount: result?.min_card_amount || 10000
    };

    return { settings };
  }
);

// Update payment settings
export interface UpdatePaymentSettingsRequest {
  defaultPaymentMethod?: string;
  requireCustomerInfo?: boolean;
  allowPartialPayment?: boolean;
  maxCashAmount?: number;
  minCardAmount?: number;
}

export const updatePaymentSettings = api(
  { method: "PUT", path: "/settings/payment-settings", expose: true },
  async (req: UpdatePaymentSettingsRequest): Promise<{ settings: PaymentSettings }> => {
    const {
      defaultPaymentMethod,
      requireCustomerInfo,
      allowPartialPayment,
      maxCashAmount,
      minCardAmount
    } = req;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (defaultPaymentMethod !== undefined) {
      updates.push(`default_payment_method = $${paramIndex++}`);
      values.push(defaultPaymentMethod);
    }
    if (requireCustomerInfo !== undefined) {
      updates.push(`require_customer_info = $${paramIndex++}`);
      values.push(requireCustomerInfo);
    }
    if (allowPartialPayment !== undefined) {
      updates.push(`allow_partial_payment = $${paramIndex++}`);
      values.push(allowPartialPayment);
    }
    if (maxCashAmount !== undefined) {
      updates.push(`max_cash_amount = $${paramIndex++}`);
      values.push(maxCashAmount);
    }
    if (minCardAmount !== undefined) {
      updates.push(`min_card_amount = $${paramIndex++}`);
      values.push(minCardAmount);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);

      const query = `
        UPDATE store_settings 
        SET ${updates.join(', ')}
        WHERE id = 1
      `;

      await settingsDB.rawExec(query, ...values);
    }

    // Return updated settings
    const result = await settingsDB.queryRow<{
      default_payment_method: string;
      require_customer_info: boolean;
      allow_partial_payment: boolean;
      max_cash_amount: number;
      min_card_amount: number;
    }>`
      SELECT default_payment_method, require_customer_info, allow_partial_payment,
             max_cash_amount, min_card_amount
      FROM store_settings
      LIMIT 1
    `;

    const settings = {
      defaultPaymentMethod: result?.default_payment_method || "Cash",
      requireCustomerInfo: result?.require_customer_info || false,
      allowPartialPayment: result?.allow_partial_payment || false,
      maxCashAmount: result?.max_cash_amount || 10000000,
      minCardAmount: result?.min_card_amount || 10000
    };

    return { settings };
  }
);

// Reorder payment methods
export const reorderPaymentMethods = api(
  { method: "POST", path: "/settings/payment-methods/reorder", expose: true },
  async (req: { methodIds: number[] }): Promise<{ success: boolean }> => {
    // Update display order for each method
    for (let i = 0; i < req.methodIds.length; i++) {
      await settingsDB.exec`
        UPDATE payment_methods 
        SET display_order = ${i + 1}, updated_at = NOW()
        WHERE id = ${req.methodIds[i]}
      `;
    }

    return { success: true };
  }
);

// Get payment method by type for quick access
export const getPaymentMethodsByType = api(
  { method: "GET", path: "/settings/payment-methods/by-type/:type", expose: true },
  async (req: { type: string }): Promise<{ paymentMethods: PaymentMethod[] }> => {
    const methods = await settingsDB.queryAll<{
      id: number;
      name: string;
      type: string;
      account_number: string | null;
      account_name: string | null;
      bank_name: string | null;
      qr_code_url: string | null;
      is_active: boolean;
      display_order: number;
      notes: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, name, type, account_number, account_name, bank_name,
             qr_code_url, is_active, display_order, notes, created_at, updated_at
      FROM payment_methods
      WHERE type = ${req.type} AND is_active = true
      ORDER BY display_order ASC, name ASC
    `;

    const paymentMethods = methods.map(method => ({
      id: method.id,
      name: method.name,
      type: method.type as PaymentMethod['type'],
      accountNumber: method.account_number || undefined,
      accountName: method.account_name || undefined,
      bankName: method.bank_name || undefined,
      qrCodeUrl: method.qr_code_url || undefined,
      isActive: method.is_active,
      displayOrder: method.display_order,
      notes: method.notes || undefined,
      createdAt: method.created_at,
      updatedAt: method.updated_at
    }));

    return { paymentMethods };
  }
);