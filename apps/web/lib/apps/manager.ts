import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export interface ClientApp {
  id: string;
  name: string;
  slug: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  apiKey: string;
  webhookUrl?: string | null;
  returnUrl?: string | null;
  description?: string | null;

  // Per-App Bank Account Setup
  upiId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  bankIfsc: string;
  usePlatformBank: boolean;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Default in-memory seed apps used as baseline and fallback
const DEFAULT_APPS: ClientApp[] = [
  {
    id: 'app-sardar-ji-food-corner',
    name: 'Sardar Ji Food Corner',
    slug: 'sardar-ji-food-corner',
    ownerName: 'Sardar Ji',
    ownerEmail: 'support@sardar-ji.com',
    apiKey: 'sp_live_sardarji_8839201948271038',
    webhookUrl: 'https://sardar-ji.vercel.app/api/starpay/webhook',
    returnUrl: 'https://sardar-ji.vercel.app/order-success',
    description: 'Authentic North Indian Cuisine, Combos & Catering',
    upiId: '9630937033@sbi',
    accountHolderName: 'Hari Singh',
    bankName: 'State Bank of India',
    accountNumber: '2441',
    bankIfsc: 'SBIN0002441',
    usePlatformBank: true,
    isActive: true,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'app-ayurdhara-divya-shakti',
    name: 'Ayurdhara Divya Shakti',
    slug: 'ayurdhara-divya-shakti',
    ownerName: 'Ayurdhara Wellness',
    ownerEmail: 'care@ayurdhara.com',
    apiKey: 'sp_live_ayurdhara_7719283748291038',
    webhookUrl: 'https://ayurdhara.com/api/payment/callback',
    returnUrl: 'https://ayurdhara.com/checkout/success',
    description: 'Ayurvedic Wellness & Herbal Remedies Store',
    upiId: '9630937033@sbi',
    accountHolderName: 'Hari Singh',
    bankName: 'State Bank of India',
    accountNumber: '2441',
    bankIfsc: 'SBIN0002441',
    usePlatformBank: true,
    isActive: true,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
];

// In-memory overlay cache for custom edits before DB migration
let inMemoryApps: Map<string, ClientApp> = new Map(DEFAULT_APPS.map(a => [a.id, a]));

function rowToApp(row: Record<string, unknown>): ClientApp {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    ownerName: row.owner_name ? String(row.owner_name) : null,
    ownerEmail: row.owner_email ? String(row.owner_email) : null,
    apiKey: String(row.api_key),
    webhookUrl: row.webhook_url ? String(row.webhook_url) : null,
    returnUrl: row.return_url ? String(row.return_url) : null,
    description: row.description ? String(row.description) : null,
    upiId: String(row.upi_id || '9630937033@sbi'),
    accountHolderName: String(row.account_holder_name || 'Hari Singh'),
    bankName: String(row.bank_name || 'State Bank of India'),
    accountNumber: String(row.account_number || '2441'),
    bankIfsc: String(row.bank_ifsc || 'SBIN0002441'),
    usePlatformBank: Boolean(row.use_platform_bank ?? true),
    isActive: Boolean(row.is_active ?? true),
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

/**
 * List all client apps from Supabase `client_apps` table.
 * Falls back safely to in-memory store if the table has not yet been migrated.
 */
export async function listClientApps(): Promise<ClientApp[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('client_apps')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map(rowToApp);
    }
  } catch {
    // DB table might not exist yet; fall through
  }

  return Array.from(inMemoryApps.values());
}

/**
 * Fetch a client app by ID.
 */
export async function getClientAppById(id: string): Promise<ClientApp | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('client_apps')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      return rowToApp(data);
    }
  } catch {
    // Fallback to memory
  }

  return inMemoryApps.get(id) || null;
}

/**
 * Find a client app by API Key, Name, or Slug.
 */
export async function getClientAppByNameOrKey(identifier: string): Promise<ClientApp | null> {
  const clean = identifier.trim().toLowerCase();
  if (!clean) return null;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('client_apps')
      .select('*');

    if (Array.isArray(data) && data.length > 0) {
      const found = data.find((row: Record<string, unknown>) => {
        const key = String(row.api_key || '').toLowerCase();
        const name = String(row.name || '').toLowerCase();
        const slug = String(row.slug || '').toLowerCase();
        return key === clean || name === clean || slug === clean;
      });
      if (found) return rowToApp(found);
    }
  } catch {
    // Fallback to memory
  }

  for (const app of inMemoryApps.values()) {
    if (
      app.apiKey.toLowerCase() === clean ||
      app.name.toLowerCase() === clean ||
      app.slug.toLowerCase() === clean
    ) {
      return app;
    }
  }

  // Also check if clean matches partial app name (e.g. "sardar ji" -> "Sardar Ji Food Corner")
  for (const app of inMemoryApps.values()) {
    if (app.name.toLowerCase().includes(clean) || clean.includes(app.name.toLowerCase())) {
      return app;
    }
  }

  return null;
}

export interface UpsertAppInput {
  id?: string;
  name: string;
  slug?: string;
  apiKey?: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  webhookUrl?: string | null;
  returnUrl?: string | null;
  description?: string | null;
  upiId?: string;
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  bankIfsc?: string;
  usePlatformBank?: boolean;
  isActive?: boolean;
}

/**
 * Create or update a client app with full per-app bank account setup.
 */
export async function saveClientApp(input: UpsertAppInput): Promise<ClientApp> {
  const existing = input.id ? await getClientAppById(input.id) : null;
  const slug = input.slug || existing?.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const id = input.id || `app-${slug}-${Date.now().toString(36)}`;
  const apiKey = input.apiKey || existing?.apiKey || `sp_live_${slug.replace(/-/g, '_')}_${crypto.randomBytes(8).toString('hex')}`;

  const appData: ClientApp = {
    id,
    name: input.name,
    slug,
    ownerName: input.ownerName || null,
    ownerEmail: input.ownerEmail || null,
    apiKey,
    webhookUrl: input.webhookUrl || null,
    returnUrl: input.returnUrl || null,
    description: input.description || null,
    upiId: input.upiId?.trim() || '9630937033@sbi',
    accountHolderName: input.accountHolderName?.trim() || 'Hari Singh',
    bankName: input.bankName?.trim() || 'State Bank of India',
    accountNumber: input.accountNumber?.trim() || '2441',
    bankIfsc: input.bankIfsc?.trim() || 'SBIN0002441',
    usePlatformBank: input.usePlatformBank ?? false,
    isActive: input.isActive ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Try persisting to Supabase
  try {
    const supabase = createAdminClient();
    const dbPayload = {
      name: appData.name,
      slug: appData.slug,
      owner_name: appData.ownerName,
      owner_email: appData.ownerEmail,
      api_key: appData.apiKey,
      webhook_url: appData.webhookUrl,
      return_url: appData.returnUrl,
      description: appData.description,
      upi_id: appData.upiId,
      account_holder_name: appData.accountHolderName,
      bank_name: appData.bankName,
      account_number: appData.accountNumber,
      bank_ifsc: appData.bankIfsc,
      use_platform_bank: appData.usePlatformBank,
      is_active: appData.isActive,
      updated_at: new Date().toISOString(),
    };

    if (input.id) {
      const { data, error } = await supabase
        .from('client_apps')
        .update(dbPayload)
        .eq('id', input.id)
        .select('*')
        .maybeSingle();

      if (!error && data) {
        const updated = rowToApp(data);
        inMemoryApps.set(updated.id, updated);
        return updated;
      }
    } else {
      const { data, error } = await supabase
        .from('client_apps')
        .insert(dbPayload)
        .select('*')
        .maybeSingle();

      if (!error && data) {
        const created = rowToApp(data);
        inMemoryApps.set(created.id, created);
        return created;
      }
    }
  } catch (err) {
    console.warn('[AppsManager] Supabase save failed, storing in memory cache:', err);
  }

  // 2. In-memory update
  inMemoryApps.set(appData.id, appData);
  return appData;
}
