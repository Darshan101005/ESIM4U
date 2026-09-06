import pool from "@/lib/db";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/site-settings-types";

export { DEFAULT_SETTINGS };
export type { SiteSettings };

/**
 * Global, client-editable website settings ("Manage Website"). Stored as a
 * single JSON row so new fields can be added without migrations. Everything
 * merges over DEFAULTS so missing keys always have a sensible value.
 */

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT site_settings_single CHECK (id = 1)
    )
  `);
  await pool.query(`INSERT INTO site_settings (id, data) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING`);
  ensured = true;
}

function merge(stored: Partial<SiteSettings> | null | undefined): SiteSettings {
  const s = stored || {};
  const storedSocials = (s.socials || {}) as Partial<SiteSettings["socials"]>;
  const socials = { ...DEFAULT_SETTINGS.socials };
  (Object.keys(socials) as (keyof SiteSettings["socials"])[]).forEach((k) => {
    socials[k] = { ...DEFAULT_SETTINGS.socials[k], ...(storedSocials[k] || {}) };
  });
  return {
    contactEmail: s.contactEmail ?? DEFAULT_SETTINGS.contactEmail,
    whatsapp: s.whatsapp ?? DEFAULT_SETTINGS.whatsapp,
    socials,
    features: { ...DEFAULT_SETTINGS.features, ...(s.features || {}) },
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    await ensureTable();
    const res = await pool.query(`SELECT data FROM site_settings WHERE id = 1`);
    return merge(res.rows[0]?.data);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Deep-merge a partial update over the current settings and persist. */
export async function updateSiteSettings(partial: Partial<SiteSettings>): Promise<SiteSettings> {
  await ensureTable();
  const current = await getSiteSettings();
  const next: SiteSettings = {
    ...current,
    ...partial,
    socials: { ...current.socials, ...(partial.socials || {}) },
    features: { ...current.features, ...(partial.features || {}) },
  };
  await pool.query(`UPDATE site_settings SET data = $1, updated_at = NOW() WHERE id = 1`, [JSON.stringify(next)]);
  return next;
}
