"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, Shield, Plus, X } from "lucide-react";
import { business as businessApi } from "@/lib/api";

interface Props {
  websiteUrl: string;
  companyName: string;
  onComplete: (rules: string[]) => void;
  onBack: () => void;
}

export default function StepQualificationRules({ websiteUrl, companyName, onComplete, onBack }: Props) {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [rules, setRules] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const result = await businessApi.scrapeQualificationRules(websiteUrl);
        const extracted: string[] = [];
        if (result.service_area?.trim()) {
          extracted.push(`Service area: ${result.service_area.trim()}`);
        }
        result.raw_rules.forEach((r) => {
          if (r.description?.trim()) extracted.push(r.description.trim());
        });
        setRules(extracted);
        setPhase("ready");
      } catch {
        setPhase("error");
      }
    }
    load();
  }, [websiteUrl]);

  async function handleConfirm() {
    setIsSaving(true);
    const validRules = rules.filter((r) => r.trim());
    try {
      await businessApi.saveQualificationRules(validRules, websiteUrl, companyName);
    } catch {
      // best-effort — continue regardless
    } finally {
      setIsSaving(false);
    }
    onComplete(validRules);
  }

  function handleSkip() {
    onComplete([]);
  }

  function updateRule(i: number, value: string) {
    setRules((prev) => prev.map((r, j) => (j === i ? value : r)));
  }

  function removeRule(i: number) {
    setRules((prev) => prev.filter((_, j) => j !== i));
  }

  function addRule() {
    setRules((prev) => [...prev, ""]);
  }

  const hasValidRules = rules.some((r) => r.trim());

  return (
    <AnimatePresence mode="wait">

      {/* ── LOADING ── */}
      {phase === "loading" && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="py-10 text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto h-12 w-12 rounded-full border-[3px] border-[#e5e7eb] border-t-[#2563eb]"
          />
          <div>
            <h3 className="text-[18px] font-bold text-[#0f172a]">Finding your qualification rules...</h3>
            <p className="mt-1 text-sm text-[#64748b]">Reading your website to understand who your ideal client is</p>
          </div>
        </motion.div>
      )}

      {/* ── ERROR ── */}
      {phase === "error" && (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-5"
        >
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm font-semibold text-amber-800">Couldn&apos;t extract rules automatically</p>
            <p className="text-xs text-amber-700 mt-1">You can type your own rules below, or skip this step for now.</p>
          </div>
          <RulesList rules={rules} onUpdate={updateRule} onRemove={removeRule} />
          <button
            onClick={addRule}
            className="flex items-center gap-1.5 text-sm text-[#2563eb] font-medium hover:underline"
          >
            <Plus className="h-4 w-4" /> Add a rule
          </button>
          <ActionButtons
            hasValidRules={hasValidRules}
            isSaving={isSaving}
            onConfirm={handleConfirm}
            onSkip={handleSkip}
            onBack={onBack}
          />
        </motion.div>
      )}

      {/* ── READY ── */}
      {phase === "ready" && (
        <motion.div
          key="ready"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-5"
        >
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4">
            <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">
                Based on your website, we&apos;ll accept leads that match:
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                Edit or remove anything that doesn&apos;t fit. Leads that don&apos;t match will be flagged for review.
              </p>
            </div>
          </div>

          {rules.length === 0 ? (
            <p className="text-sm text-[#94a3b8] italic py-2">No rules found — add your own below.</p>
          ) : (
            <div className="space-y-2">
              {rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  </div>
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => updateRule(i, e.target.value)}
                    className="flex-1 rounded-xl bg-white px-3 py-2.5 text-[14px] text-[#0f172a] outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
                  />
                  <button
                    onClick={() => removeRule(i)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={addRule}
            className="flex items-center gap-1.5 text-sm text-[#2563eb] font-medium hover:underline"
          >
            <Plus className="h-4 w-4" /> Add a rule
          </button>

          <div className="h-px bg-[#e5e7eb]" />

          <ActionButtons
            hasValidRules={hasValidRules}
            isSaving={isSaving}
            onConfirm={handleConfirm}
            onSkip={handleSkip}
            onBack={onBack}
          />
        </motion.div>
      )}

    </AnimatePresence>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function RulesList({
  rules,
  onUpdate,
  onRemove,
}: {
  rules: string[];
  onUpdate: (i: number, v: string) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="space-y-2">
      {rules.map((rule, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={rule}
            onChange={(e) => onUpdate(i, e.target.value)}
            className="flex-1 rounded-xl bg-white px-3 py-2.5 text-[14px] text-[#0f172a] outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
            placeholder="e.g. Must be in Sacramento area"
          />
          <button onClick={() => onRemove(i)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ActionButtons({
  hasValidRules,
  isSaving,
  onConfirm,
  onSkip,
  onBack,
}: {
  hasValidRules: boolean;
  isSaving: boolean;
  onConfirm: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-3">
      <button
        onClick={onConfirm}
        disabled={isSaving || !hasValidRules}
        className="w-full h-[46px] rounded-full bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all duration-150"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>Looks right — continue <ArrowRight className="h-4 w-4" /></>
        )}
      </button>
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-[#94a3b8] hover:text-[#64748b] font-medium transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onSkip}
          className="text-sm text-[#94a3b8] hover:text-[#64748b] font-medium transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
