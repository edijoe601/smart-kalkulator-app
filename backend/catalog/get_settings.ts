import { api } from "encore.dev/api";
import { catalogDB } from "./db";

export interface CatalogSettings {
  id: number;
  storeName: string;
  storeDescription?: string;
  storeLogoUrl?: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  isActive: boolean;
  deliveryFee: number;
  minOrderAmount: number;
}

export interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  accountNumber?: string;
  accountName?: string;
  instructions?: string;
  isActive: boolean;
}

export interface CatalogSettingsResponse {
  settings: CatalogSettings;
  paymentMethods: PaymentMethod[];
}

// Retrieves catalog settings and payment methods.
export const getSettings = api<void, CatalogSettingsResponse>(
  { expose: true, method: "GET", path: "/catalog/settings" },
  async () => {
    const settingsRow = await catalogDB.queryRow<{
      id: number;
      store_name: string;
      store_description: string | null;
      store_logo_url: string | null;
      store_address: string | null;
      store_phone: string | null;
      store_email: string | null;
      is_active: boolean;
      delivery_fee: number;
      min_order_amount: number;
    }>`SELECT * FROM catalog_settings LIMIT 1`;

    if (!settingsRow) {
      throw new Error("Catalog settings not found");
    }

    const paymentMethodsRows = await catalogDB.queryAll<{
      id: number;
      name: string;
      type: string;
      account_number: string | null;
      account_name: string | null;
      instructions: string | null;
      is_active: boolean;
    }>`SELECT * FROM payment_methods WHERE is_active = true ORDER BY name`;

    const settings: CatalogSettings = {
      id: settingsRow.id,
      storeName: settingsRow.store_name,
      storeDescription: settingsRow.store_description || undefined,
      storeLogoUrl: settingsRow.store_logo_url || undefined,
      storeAddress: settingsRow.store_address || undefined,
      storePhone: settingsRow.store_phone || undefined,
      storeEmail: settingsRow.store_email || undefined,
      isActive: settingsRow.is_active,
      deliveryFee: settingsRow.delivery_fee,
      minOrderAmount: settingsRow.min_order_amount
    };

    const paymentMethods: PaymentMethod[] = paymentMethodsRows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      accountNumber: row.account_number || undefined,
      accountName: row.account_name || undefined,
      instructions: row.instructions || undefined,
      isActive: row.is_active
    }));

    return { settings, paymentMethods };
  }
);
