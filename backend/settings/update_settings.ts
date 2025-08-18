import { api } from "encore.dev/api";
import { settingsDB } from "./db";
import { StoreSettings } from "./get_settings";

export interface UpdateSettingsRequest {
  storeName?: string;
  storeDescription?: string;
  storeLogoUrl?: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  storeWebsite?: string;
  businessType?: string;
  taxNumber?: string;
  currency?: string;
  timezone?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  receiptWidth?: number;
  autoPrintReceipt?: boolean;
}

// Updates store settings.
export const updateSettings = api<UpdateSettingsRequest, StoreSettings>(
  { expose: true, method: "PUT", path: "/settings" },
  async (req) => {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.storeName !== undefined) {
      updates.push(`store_name = $${paramIndex++}`);
      values.push(req.storeName);
    }
    if (req.storeDescription !== undefined) {
      updates.push(`store_description = $${paramIndex++}`);
      values.push(req.storeDescription || null);
    }
    if (req.storeLogoUrl !== undefined) {
      updates.push(`store_logo_url = $${paramIndex++}`);
      values.push(req.storeLogoUrl || null);
    }
    if (req.storeAddress !== undefined) {
      updates.push(`store_address = $${paramIndex++}`);
      values.push(req.storeAddress || null);
    }
    if (req.storePhone !== undefined) {
      updates.push(`store_phone = $${paramIndex++}`);
      values.push(req.storePhone || null);
    }
    if (req.storeEmail !== undefined) {
      updates.push(`store_email = $${paramIndex++}`);
      values.push(req.storeEmail || null);
    }
    if (req.storeWebsite !== undefined) {
      updates.push(`store_website = $${paramIndex++}`);
      values.push(req.storeWebsite || null);
    }
    if (req.businessType !== undefined) {
      updates.push(`business_type = $${paramIndex++}`);
      values.push(req.businessType || null);
    }
    if (req.taxNumber !== undefined) {
      updates.push(`tax_number = $${paramIndex++}`);
      values.push(req.taxNumber || null);
    }
    if (req.currency !== undefined) {
      updates.push(`currency = $${paramIndex++}`);
      values.push(req.currency);
    }
    if (req.timezone !== undefined) {
      updates.push(`timezone = $${paramIndex++}`);
      values.push(req.timezone);
    }
    if (req.receiptHeader !== undefined) {
      updates.push(`receipt_header = $${paramIndex++}`);
      values.push(req.receiptHeader || null);
    }
    if (req.receiptFooter !== undefined) {
      updates.push(`receipt_footer = $${paramIndex++}`);
      values.push(req.receiptFooter || null);
    }
    if (req.receiptWidth !== undefined) {
      updates.push(`receipt_width = $${paramIndex++}`);
      values.push(req.receiptWidth);
    }
    if (req.autoPrintReceipt !== undefined) {
      updates.push(`auto_print_receipt = $${paramIndex++}`);
      values.push(req.autoPrintReceipt);
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE store_settings 
      SET ${updates.join(', ')}
      WHERE id = (SELECT id FROM store_settings LIMIT 1)
      RETURNING *
    `;

    const row = await settingsDB.rawQueryRow<{
      id: number;
      store_name: string;
      store_description: string | null;
      store_logo_url: string | null;
      store_address: string | null;
      store_phone: string | null;
      store_email: string | null;
      store_website: string | null;
      business_type: string | null;
      tax_number: string | null;
      currency: string;
      timezone: string;
      receipt_header: string | null;
      receipt_footer: string | null;
      receipt_width: number;
      auto_print_receipt: boolean;
      created_at: Date;
      updated_at: Date;
    }>(query, ...values);

    if (!row) {
      throw new Error("Failed to update settings");
    }

    return {
      id: row.id,
      storeName: row.store_name,
      storeDescription: row.store_description || undefined,
      storeLogoUrl: row.store_logo_url || undefined,
      storeAddress: row.store_address || undefined,
      storePhone: row.store_phone || undefined,
      storeEmail: row.store_email || undefined,
      storeWebsite: row.store_website || undefined,
      businessType: row.business_type || undefined,
      taxNumber: row.tax_number || undefined,
      currency: row.currency,
      timezone: row.timezone,
      receiptHeader: row.receipt_header || undefined,
      receiptFooter: row.receipt_footer || undefined,
      receiptWidth: row.receipt_width,
      autoPrintReceipt: row.auto_print_receipt,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
);
