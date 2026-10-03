export interface AppIdentitySource {
  businessName?: string | null;
  appName?: string | null;
  merchantName?: string | null;
  metadata?: Record<string, unknown> | null;
  webhookUrl?: string | null;
  returnUrl?: string | null;
  description?: string | null;
}

/**
 * Resolves a human-friendly client app name from any available order information.
 * Guarantees that no order is ever orphaned or displays as "—".
 */
export function resolveAppName(source: AppIdentitySource): string {
  // 1. Direct explicit names
  const directName = source.businessName || source.appName || source.merchantName;
  if (directName && typeof directName === 'string' && directName.trim() && directName.trim() !== '—') {
    return directName.trim();
  }

  // 2. Names from metadata object
  const meta = (source.metadata as Record<string, unknown>) ?? {};
  const metaName = (meta.businessName || meta.appName || meta.merchantName || meta.clientApp || meta.client_name) as string | undefined;
  if (metaName && typeof metaName === 'string' && metaName.trim() && metaName.trim() !== '—') {
    return metaName.trim();
  }

  // 3. Inspect webhookUrl / returnUrl domains
  const urlToCheck = source.webhookUrl || source.returnUrl || (meta.webhookUrl as string) || (meta.returnUrl as string) || (meta.webhook_url as string);
  if (urlToCheck && typeof urlToCheck === 'string') {
    try {
      const parsed = new URL(urlToCheck.startsWith('http') ? urlToCheck : `https://${urlToCheck}`);
      const host = parsed.hostname.toLowerCase();
      if (host.includes('sardar-ji') || host.includes('sardarji')) {
        return 'Sardar Ji Food Corner';
      }
      if (host.includes('ayurdhara')) {
        return 'Ayurdhara';
      }
      // If other custom domain, format hostname nicely (e.g. mystore.vercel.app -> Mystore)
      const clean = host.replace('.vercel.app', '').replace('www.', '').split('.')[0] || host;
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    } catch {
      // not a valid URL
    }
  }

  // 4. Inspect metadata purpose / description for Sardar Ji clues
  const purpose = String(meta.purpose ?? '').toLowerCase();
  const desc = String(source.description ?? '').toLowerCase();
  if (
    purpose.includes('food') ||
    purpose.includes('thali') ||
    purpose.includes('subscription') ||
    desc.includes('food') ||
    desc.includes('thali')
  ) {
    return 'Sardar Ji Food Corner';
  }

  // 5. Default merchant fallback
  return 'StarPay Direct';
}
