import { api } from "encore.dev/api";
import { settingsDB } from "./db";

export interface StoreSettings {
  id: number;
  storeName: string;
  storeDescription?: string;
  storeLogoUrl?: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  storeWebsite?: string;
  businessType?: string;
  taxNumber?: string;
  currency: string;
  timezone: string;
  receiptHeader?: string;
  receiptFooter?: string;
  receiptWidth: number;
  autoPrintReceipt: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Retrieves store settings.
export const getSettings = api<void, StoreSettings>(
  { expose: true, method: "GET", path: "/settings" },
  async () => {
    const row = await settingsDB.queryRow<{
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
    }>`SELECT * FROM store_settings LIMIT 1`;

    if (!row) {
      throw new Error("Store settings not found");
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
