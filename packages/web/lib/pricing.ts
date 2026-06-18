import pool from "@/lib/db";

export type MarkupType = "percent" | "fixed";
export type ScopeType = "country" | "region" | "global";

export interface PricingRule {
  id: number;
  scope_type: ScopeType;
  scope_code: string;
  markup_type: MarkupType;
  markup_value: number;
  updated_at: string;
}

export const GLOBAL_SCOPE_CODE = "GLOBAL";

export async function loadPricingRules(): Promise<PricingRule[]> {
  const result = await pool.query(
    `SELECT id, scope_type, scope_code, markup_type, markup_value, updated_at FROM pricing_rules ORDER BY scope_type, scope_code`
  );
  return result.rows.map((r) => ({
    ...r,
    markup_value: parseFloat(r.markup_value),
  }));
}

export async function upsertPricingRule(
  scopeType: ScopeType,
  scopeCode: string,
  markupType: MarkupType,
  markupValue: number
): Promise<PricingRule> {
  const code = scopeType === "global" ? GLOBAL_SCOPE_CODE : scopeCode;
  const result = await pool.query(
    `INSERT INTO pricing_rules (scope_type, scope_code, markup_type, markup_value, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (scope_type, scope_code)
     DO UPDATE SET markup_type = $3, markup_value = $4, updated_at = NOW()
     RETURNING id, scope_type, scope_code, markup_type, markup_value, updated_at`,
    [scopeType, code, markupType, markupValue]
  );
  const row = result.rows[0];
  return { ...row, markup_value: parseFloat(row.markup_value) };
}

export async function deletePricingRule(scopeType: ScopeType, scopeCode: string): Promise<void> {
  const code = scopeType === "global" ? GLOBAL_SCOPE_CODE : scopeCode;
  await pool.query(`DELETE FROM pricing_rules WHERE scope_type = $1 AND scope_code = $2`, [scopeType, code]);
}

export interface Pricer {
  priceFor: (cost: number, target: { countryCodes?: string[]; regionCode?: string }) => number;
}

function applyRule(cost: number, rule: PricingRule | undefined): number {
  if (!rule || !rule.markup_value) return round(cost);
  if (rule.markup_type === "percent") {
    return round(cost * (1 + rule.markup_value / 100));
  }
  return round(cost + rule.markup_value);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildPricer(rules: PricingRule[]): Pricer {
  const countryRules = new Map<string, PricingRule>();
  const regionRules = new Map<string, PricingRule>();
  let globalRule: PricingRule | undefined;

  for (const rule of rules) {
    if (rule.scope_type === "country") countryRules.set(rule.scope_code.toUpperCase(), rule);
    else if (rule.scope_type === "region") regionRules.set(rule.scope_code.toLowerCase(), rule);
    else if (rule.scope_type === "global") globalRule = rule;
  }

  return {
    priceFor(cost, target) {
      for (const code of target.countryCodes || []) {
        const rule = countryRules.get(code.toUpperCase());
        if (rule) return applyRule(cost, rule);
      }
      if (target.regionCode) {
        const rule = regionRules.get(target.regionCode.toLowerCase());
        if (rule) return applyRule(cost, rule);
      }
      return applyRule(cost, globalRule);
    },
  };
}

export async function getPricer(): Promise<Pricer> {
  const rules = await loadPricingRules();
  return buildPricer(rules);
}
