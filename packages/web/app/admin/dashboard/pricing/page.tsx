"use client";

import AdminTopbar from "@/components/admin/admin-topbar";
import SelectMenu from "@/components/admin/select-menu";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2, Tag, Globe, MapPin, Percent, DollarSign, Save } from "lucide-react";
import toast from "react-hot-toast";

interface Rule {
  id: number;
  scope_type: "country" | "region" | "global";
  scope_code: string;
  markup_type: "percent" | "fixed";
  markup_value: number;
  updated_at: string;
}

interface Country {
  country_name: string;
  iso3_code: string;
}

interface Region {
  region_code: string;
  region_name: string;
}

export default function AdminPricingPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [addingRule, setAddingRule] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [globalType, setGlobalType] = useState<"percent" | "fixed">("percent");
  const [globalValue, setGlobalValue] = useState("0");

  const [scopeType, setScopeType] = useState<"country" | "region">("country");
  const [scopeCode, setScopeCode] = useState("");
  const [newType, setNewType] = useState<"percent" | "fixed">("percent");
  const [newValue, setNewValue] = useState("");

  const load = useCallback(async () => {
    try {
      const [rRes, cRes, regRes] = await Promise.all([
        fetch("/api/admin/pricing"),
        fetch("/api/montyesim/countries"),
        fetch("/api/montyesim/regions"),
      ]);
      if (!rRes.ok) throw new Error();
      const rData = await rRes.json();
      const cData = cRes.ok ? await cRes.json() : { countries: [] };
      const regData = regRes.ok ? await regRes.json() : { regions: [] };

      const loadedRules: Rule[] = rData.rules || [];
      setRules(loadedRules);
      setCountries(cData.countries || []);
      setRegions(regData.regions || []);

      const global = loadedRules.find((r) => r.scope_type === "global");
      if (global) {
        setGlobalType(global.markup_type);
        setGlobalValue(String(global.markup_value));
      }
    } catch {
      toast.error("Failed to load pricing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveRule = async (
    scope_type: string,
    scope_code: string,
    markup_type: string,
    markup_value: number
  ) => {
    const res = await fetch("/api/admin/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope_type, scope_code, markup_type, markup_value }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || "Save failed");
    }
  };

  const saveGlobal = async () => {
    setSavingGlobal(true);
    try {
      await saveRule("global", "GLOBAL", globalType, Number(globalValue));
      toast.success("Global markup saved");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingGlobal(false);
    }
  };

  const addRule = async () => {
    if (!scopeCode) {
      toast.error("Select a destination");
      return;
    }
    if (newValue === "" || Number(newValue) < 0) {
      toast.error("Enter a valid markup value");
      return;
    }
    setAddingRule(true);
    try {
      await saveRule(scopeType, scopeCode, newType, Number(newValue));
      toast.success("Markup rule saved");
      setScopeCode("");
      setNewValue("");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setAddingRule(false);
    }
  };

  const deleteRule = async (rule: Rule) => {
    setDeletingId(rule.id);
    try {
      const res = await fetch(
        `/api/admin/pricing?scope_type=${rule.scope_type}&scope_code=${encodeURIComponent(rule.scope_code)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      toast.success("Rule removed");
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
    } catch {
      toast.error("Failed to remove rule");
    } finally {
      setDeletingId(null);
    }
  };

  const labelFor = (rule: Rule) => {
    if (rule.scope_type === "country") {
      return countries.find((c) => c.iso3_code === rule.scope_code)?.country_name || rule.scope_code;
    }
    if (rule.scope_type === "region") {
      return regions.find((r) => r.region_code === rule.scope_code)?.region_name || rule.scope_code;
    }
    return "All destinations (default)";
  };

  const specificRules = rules.filter((r) => r.scope_type !== "global");

  return (
    <>
      <AdminTopbar title="Pricing & Markup" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF561E] animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-[#FF561E]" />
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Global Default Markup</h3>
              </div>
              <p className="text-[13px] text-[#6B7280] mb-5">
                Applied to every bundle unless a country or region rule overrides it.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[12px] font-medium text-[#6B7280] mb-2">Markup Type</label>
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setGlobalType("percent")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold transition-colors ${globalType === "percent" ? "bg-[#FF561E] text-white" : "bg-white text-[#6B7280]"}`}
                    >
                      <Percent className="w-3.5 h-3.5" /> Percent
                    </button>
                    <button
                      onClick={() => setGlobalType("fixed")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold transition-colors ${globalType === "fixed" ? "bg-[#FF561E] text-white" : "bg-white text-[#6B7280]"}`}
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Fixed
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-[12px] font-medium text-[#6B7280] mb-2">
                    Value {globalType === "percent" ? "(%)" : "($)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={globalValue}
                    onChange={(e) => setGlobalValue(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] transition-all"
                  />
                </div>
                <button
                  onClick={saveGlobal}
                  disabled={savingGlobal}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors shadow-sm shadow-orange-500/20 disabled:opacity-70"
                >
                  {savingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center gap-2 mb-5">
                <Plus className="w-5 h-5 text-[#FF561E]" />
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Add Country / Region Rule</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#6B7280] mb-2">Scope</label>
                  <SelectMenu
                    value={scopeType}
                    onChange={(v) => {
                      setScopeType(v as "country" | "region");
                      setScopeCode("");
                    }}
                    options={[
                      { value: "country", label: "Country" },
                      { value: "region", label: "Region" },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#6B7280] mb-2">Destination</label>
                  <SelectMenu
                    value={scopeCode}
                    onChange={setScopeCode}
                    placeholder="Select..."
                    options={
                      scopeType === "country"
                        ? countries.map((c) => ({ value: c.iso3_code, label: c.country_name }))
                        : regions.map((r) => ({ value: r.region_code, label: r.region_name }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#6B7280] mb-2">Markup Type</label>
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setNewType("percent")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold transition-colors ${newType === "percent" ? "bg-[#FF561E] text-white" : "bg-white text-[#6B7280]"}`}
                    >
                      <Percent className="w-3.5 h-3.5" /> Percent
                    </button>
                    <button
                      onClick={() => setNewType("fixed")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold transition-colors ${newType === "fixed" ? "bg-[#FF561E] text-white" : "bg-white text-[#6B7280]"}`}
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Fixed
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#6B7280] mb-2">
                    Value {newType === "percent" ? "(%)" : "($)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] text-[14px]"
                  />
                </div>
              </div>
              <button
                onClick={addRule}
                disabled={addingRule}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A1D20] text-white text-[14px] font-bold hover:bg-black transition-colors disabled:opacity-70"
              >
                {addingRule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Rule
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
                <Tag className="w-5 h-5 text-[#FF561E]" />
                <h3 className="text-[16px] font-bold text-[#1A1D20]">Active Rules</h3>
              </div>
              {specificRules.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[14px] text-[#6B7280] font-medium">
                    No country or region rules. The global default applies everywhere.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {specificRules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#FFF4F0] flex items-center justify-center">
                          {rule.scope_type === "country" ? (
                            <Globe className="w-4 h-4 text-[#FF561E]" />
                          ) : (
                            <MapPin className="w-4 h-4 text-[#FF561E]" />
                          )}
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-[#1A1D20]">{labelFor(rule)}</p>
                          <p className="text-[12px] text-[#6B7280] capitalize">{rule.scope_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[14px] font-bold text-[#FF561E]">
                          {rule.markup_type === "percent" ? `+${rule.markup_value}%` : `+$${rule.markup_value.toFixed(2)}`}
                        </span>
                        <button
                          onClick={() => deleteRule(rule)}
                          disabled={deletingId === rule.id}
                          className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-red-50 hover:border-red-100 transition-colors"
                        >
                          {deletingId === rule.id ? (
                            <Loader2 className="w-4 h-4 text-[#6B7280] animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-[#6B7280]" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
