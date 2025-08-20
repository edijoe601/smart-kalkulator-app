import { api } from "encore.dev/api";
import { adminDB } from "./db";
import { getAuthData } from "~encore/auth";

export interface LandingPageSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroCTAText: string;
  featuresTitle: string;
  pricingTitle: string;
  trialDays: number;
  monthlyPrice: number;
  yearlyPrice: number;
  contactEmail: string;
  contactPhone: string;
}

export interface UpdateLandingPageRequest {
  heroTitle?: string;
  heroSubtitle?: string;
  heroCTAText?: string;
  featuresTitle?: string;
  pricingTitle?: string;
  trialDays?: number;
  monthlyPrice?: number;
  yearlyPrice?: number;
  contactEmail?: string;
  contactPhone?: string;
}

// Retrieves landing page settings.
export const getLandingPageSettings = api<void, LandingPageSettings>(
  { expose: true, method: "GET", path: "/admin/landing-page/settings" },
  async () => {
    const settings = await adminDB.queryRow<{
      hero_title: string;
      hero_subtitle: string;
      hero_cta_text: string;
      features_title: string;
      pricing_title: string;
      trial_days: number;
      monthly_price: number;
      yearly_price: number;
      contact_email: string;
      contact_phone: string;
    }>`SELECT * FROM landing_page_settings WHERE id = 1`;

    if (!settings) {
      throw new Error("Landing page settings not found");
    }

    return {
      heroTitle: settings.hero_title,
      heroSubtitle: settings.hero_subtitle,
      heroCTAText: settings.hero_cta_text,
      featuresTitle: settings.features_title,
      pricingTitle: settings.pricing_title,
      trialDays: settings.trial_days,
      monthlyPrice: settings.monthly_price,
      yearlyPrice: settings.yearly_price,
      contactEmail: settings.contact_email,
      contactPhone: settings.contact_phone
    };
  }
);

// Updates landing page settings.
export const updateLandingPageSettings = api<UpdateLandingPageRequest, LandingPageSettings>(
  { auth: true, expose: true, method: "PUT", path: "/admin/landing-page/settings" },
  async (req) => {
    const auth = getAuthData()!;
    
    if (auth.role !== 'admin') {
      throw new Error("Access denied");
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.heroTitle !== undefined) {
      updates.push(`hero_title = $${paramIndex++}`);
      values.push(req.heroTitle);
    }
    if (req.heroSubtitle !== undefined) {
      updates.push(`hero_subtitle = $${paramIndex++}`);
      values.push(req.heroSubtitle);
    }
    if (req.heroCTAText !== undefined) {
      updates.push(`hero_cta_text = $${paramIndex++}`);
      values.push(req.heroCTAText);
    }
    if (req.featuresTitle !== undefined) {
      updates.push(`features_title = $${paramIndex++}`);
      values.push(req.featuresTitle);
    }
    if (req.pricingTitle !== undefined) {
      updates.push(`pricing_title = $${paramIndex++}`);
      values.push(req.pricingTitle);
    }
    if (req.trialDays !== undefined) {
      updates.push(`trial_days = $${paramIndex++}`);
      values.push(req.trialDays);
    }
    if (req.monthlyPrice !== undefined) {
      updates.push(`monthly_price = $${paramIndex++}`);
      values.push(req.monthlyPrice);
    }
    if (req.yearlyPrice !== undefined) {
      updates.push(`yearly_price = $${paramIndex++}`);
      values.push(req.yearlyPrice);
    }
    if (req.contactEmail !== undefined) {
      updates.push(`contact_email = $${paramIndex++}`);
      values.push(req.contactEmail);
    }
    if (req.contactPhone !== undefined) {
      updates.push(`contact_phone = $${paramIndex++}`);
      values.push(req.contactPhone);
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE landing_page_settings 
      SET ${updates.join(', ')}
      WHERE id = 1
      RETURNING *
    `;

    const settings = await adminDB.rawQueryRow<{
      hero_title: string;
      hero_subtitle: string;
      hero_cta_text: string;
      features_title: string;
      pricing_title: string;
      trial_days: number;
      monthly_price: number;
      yearly_price: number;
      contact_email: string;
      contact_phone: string;
    }>(query, ...values);

    if (!settings) {
      throw new Error("Failed to update settings");
    }

    return {
      heroTitle: settings.hero_title,
      heroSubtitle: settings.hero_subtitle,
      heroCTAText: settings.hero_cta_text,
      featuresTitle: settings.features_title,
      pricingTitle: settings.pricing_title,
      trialDays: settings.trial_days,
      monthlyPrice: settings.monthly_price,
      yearlyPrice: settings.yearly_price,
      contactEmail: settings.contact_email,
      contactPhone: settings.contact_phone
    };
  }
);
