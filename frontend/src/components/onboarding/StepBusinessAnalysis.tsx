"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Globe, Building2, AlertCircle, AlertTriangle } from "lucide-react";
import { auth, business as businessApi } from "@/lib/api";
import type { BusinessAnalysis } from "@/types";

/* ─── Constants ──────────────────────────────────────────────────────────── */

const COMMON_EMAIL_DOMAINS = new Set([
  "gmail", "yahoo", "hotmail", "outlook", "icloud", "protonmail", "proton",
  "mail", "live", "msn", "aol", "me", "ymail", "googlemail",
]);

const LOADING_STEPS = [
  "Visiting your website...",
  "Reading your content...",
  "Understanding your business...",
  "Building your profile...",
];

const AUDIENCE_OPTIONS = [
  { id: "homeowners",    label: "Homeowners" },
  { id: "small_business", label: "Small Businesses (1–50 employees)" },
  { id: "enterprise",   label: "Enterprise (50+ employees)" },
  { id: "consumers",    label: "General Consumers" },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function domainToCompanyName(email: string): string {
  const at = email.indexOf("@");
  if (at < 0) return "";
  const domain = email.slice(at + 1).split(".")[0] ?? "";
  if (COMMON_EMAIL_DOMAINS.has(domain.toLowerCase())) return "";
  const cleaned = domain
    .replace(/(?:llc|inc|corp|co|ltd|group|company|solutions|services|consulting|digital|media|tech|labs)$/i, "")
    .trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|co|the|company|group|solutions|services|consulting)\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Returns 0..1 where 1 = identical, based on word-level Jaccard similarity. */
function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 1; // one is empty → don't warn
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const wordsA = na.split(" ").filter(Boolean);
  const wordsB = nb.split(" ").filter(Boolean);
  const setB = new Set(wordsB);
  const intersection = wordsA.filter((w) => setB.has(w)).length;
  const allWords = Array.from(new Set([...wordsA, ...wordsB]));
  const union = allWords.length;
  return union === 0 ? 1 : intersection / union;
}

function fade(delay: number) {
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.4, ease: "easeOut" as const },
  };
}

/* ─── Types ──────────────────────────────────────────────────────────────── */

type Phase = "input" | "analyzing" | "mismatch" | "results" | "url_error";

interface Props {
  onComplete: (result: BusinessAnalysis & {
    company_name: string;
    website_url: string;
    audienceType: "everyone" | "specific";
    selectedAudiences: string[];
  }) => void;
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function StepBusinessAnalysis({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("input");
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [visibleSteps, setVisibleSteps] = useState(0);

  const [result, setResult] = useState<BusinessAnalysis | null>(null);
  const [detectedSiteName, setDetectedSiteName] = useState("");

  const [editedDescription, setEditedDescription] = useState("");
  const [editedStyle, setEditedStyle] = useState("");
  const [editedWhatYouSell, setEditedWhatYouSell] = useState("");
  const [editedBusinessType, setEditedBusinessType] = useState<"products" | "services">("services");

  const [audienceType, setAudienceType] = useState<"everyone" | "specific">("everyone");
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [customAudience, setCustomAudience] = useState("");
  const [customChecked, setCustomChecked] = useState(false);

  const [confirmed, setConfirmed] = useState(false);

  // Pre-fill company name from tenant name → email domain fallback
  useEffect(() => {
    auth.tenant()
      .then((t) => {
        if (t?.name?.trim()) {
          setCompanyName(t.name.trim());
        } else {
          auth.me().then((u) => {
            if (u?.email) {
              const n = domainToCompanyName(u.email);
              if (n) setCompanyName(n);
            }
          }).catch(() => null);
        }
      })
      .catch(() => {
        auth.me().then((u) => {
          if (u?.email) {
            const n = domainToCompanyName(u.email);
            if (n) setCompanyName(n);
          }
        }).catch(() => null);
      });
  }, []);

  // Loading step ticker
  useEffect(() => {
    if (phase !== "analyzing") return;
    setVisibleSteps(0);
    const timers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setVisibleSteps(i + 1), i * 1500)
    );
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  function validateUrl(url: string): boolean {
    const s = url.trim();
    if (!s) return false;
    try {
      const u = new URL(s.startsWith("http") ? s : `https://${s}`);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function handleAnalyze() {
    if (!websiteUrl.trim()) { setUrlError("Website URL is required."); return; }
    if (!validateUrl(websiteUrl)) { setUrlError("Please enter a valid URL (e.g. https://yoursite.com)."); return; }
    setUrlError("");
    setPhase("analyzing");

    const normalizedUrl = websiteUrl.trim().startsWith("http")
      ? websiteUrl.trim()
      : `https://${websiteUrl.trim()}`;

    // Step 1: Fetch website via Next.js API route (avoids CORS + backend network limits)
    let websiteText = "";
    let siteName = "";

    try {
      const fetchController = new AbortController();
      const fetchTimeout = setTimeout(() => fetchController.abort(), 15000);
      const fetchRes = await fetch("/api/fetch-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
        signal: fetchController.signal,
      });
      clearTimeout(fetchTimeout);

      if (!fetchRes.ok) {
        setPhase("url_error");
        return;
      }

      const fetchData = await fetchRes.json();
      if (!fetchData.ok) {
        setPhase("url_error");
        return;
      }

      websiteText = fetchData.text ?? "";
      siteName = fetchData.site_name ?? "";
    } catch {
      setPhase("url_error");
      return;
    }

    // Step 2: Send fetched content to backend for Claude analysis
    const [analysisResult] = await Promise.all([
      Promise.race([
        businessApi.analyze({
          company_name: companyName.trim() || "My Business",
          website_url: normalizedUrl,
          website_text: websiteText,
          detected_site_name: siteName,
        }).then((r) => { console.log("[analyze] backend response:", r); return r; })
          .catch((err) => { console.error("[analyze] API call failed:", err?.response?.status, err?.response?.data ?? err?.message); return null; }),
        new Promise<null>((res) => setTimeout(() => res(null), 25000)),
      ]),
      // Minimum 3s so loading steps are visible
      new Promise<void>((res) => setTimeout(res, 3000)),
    ]);

    const fallback: BusinessAnalysis = {
      business_description: `${companyName.trim() || "Your business"} provides professional services to help clients achieve their goals.`,
      primary_audience: "Businesses and individuals looking for quality solutions.",
      message_style: "Friendly and professional, focused on building trust and demonstrating value.",
      what_you_sell: "Professional services",
      business_type: "services",
      url_accessible: true,
      detected_site_name: siteName,
    };

    const final = analysisResult ?? fallback;
    setResult(final);
    setEditedDescription(final.business_description);
    setEditedStyle(final.message_style);
    setEditedWhatYouSell(final.what_you_sell);
    setEditedBusinessType(final.business_type === "products" ? "products" : "services");

    // Step 3: Check for name mismatch
    setDetectedSiteName(siteName);
    const enteredName = companyName.trim();
    if (siteName && enteredName && nameSimilarity(enteredName, siteName) < 0.7) {
      setPhase("mismatch");
    } else {
      setPhase("results");
    }
  }

  function proceedToResults() {
    setPhase("results");
  }

  function buildAudiences(): string[] {
    const base = audienceType === "specific" ? [...selectedAudiences] : [];
    if (customChecked && customAudience.trim()) {
      base.push(`custom: ${customAudience.trim()}`);
    }
    return base;
  }

  function handleConfirm() {
    if (!confirmed || !result) return;
    const url = websiteUrl.trim().startsWith("http")
      ? websiteUrl.trim()
      : `https://${websiteUrl.trim()}`;
    onComplete({
      business_description: editedDescription,
      primary_audience: result.primary_audience,
      message_style: editedStyle,
      what_you_sell: editedWhatYouSell,
      business_type: editedBusinessType,
      url_accessible: true,
      detected_site_name: detectedSiteName,
      company_name: companyName.trim(),
      website_url: url,
      audienceType,
      selectedAudiences: buildAudiences(),
    });
  }

  const canContinue =
    confirmed &&
    editedWhatYouSell.trim().length > 0 &&
    (audienceType === "everyone" || selectedAudiences.length > 0 || (customChecked && customAudience.trim().length > 0));

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <AnimatePresence mode="wait">

      {/* ── INPUT ── */}
      {phase === "input" && (
        <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-5">
          <p className="text-[14px] text-[#64748b] leading-relaxed">
            We&apos;ll analyze your website to understand what you do and who you serve, then pre-build your follow-up system.
          </p>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#0f172a]">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-[#64748b]" />
                Company name
              </span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAnalyze(); }}
              placeholder="e.g. Apex Roofing LLC"
              className="w-full rounded-xl bg-white px-4 py-3 text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#0f172a]">
              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-[#64748b]" />
                Website URL<span className="text-red-500 ml-0.5">*</span>
              </span>
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => { setWebsiteUrl(e.target.value); setUrlError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAnalyze(); }}
              placeholder="https://www.yoursite.com"
              className={`w-full rounded-xl bg-white px-4 py-3 text-[15px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:ring-2 transition-all ${urlError ? "ring-2 ring-red-400/40" : "focus:ring-[#2563eb]/20"}`}
            />
            {urlError
              ? <p className="mt-1.5 text-sm text-red-500">{urlError}</p>
              : <p className="mt-1.5 text-xs text-[#94a3b8]">Required — we read your site to understand what you do and who you serve.</p>
            }
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!websiteUrl.trim()}
              className="h-[46px] rounded-full bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-semibold flex items-center justify-center gap-2 px-6 py-2.5 transition-all duration-150"
            >
              Analyze My Business<ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── ANALYZING ── */}
      {phase === "analyzing" && (
        <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="py-8">
          <div className="mb-10 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto mb-6 h-12 w-12 rounded-full border-[3px] border-[#e5e7eb] border-t-[#2563eb]"
            />
            <h3 className="text-[18px] font-bold text-[#0f172a]">Analyzing your business...</h3>
            <p className="mt-1 text-sm text-[#64748b]">This takes just a few seconds</p>
          </div>
          <div className="space-y-4 max-w-sm mx-auto">
            {LOADING_STEPS.map((step, i) => (
              <AnimatePresence key={i}>
                {visibleSteps > i && (
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-[15px] text-[#374151]">{step}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── URL ERROR ── */}
      {phase === "url_error" && (
        <motion.div key="url_error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="py-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 border border-red-100 mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-[18px] font-bold text-[#0f172a] mb-2">We couldn&apos;t access this website</h3>
            <p className="text-[14px] text-[#64748b] leading-relaxed max-w-sm mx-auto">
              Please check the URL and try again. Make sure the website is publicly accessible.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setPhase("input"); setUrlError(""); }}
            className="h-[48px] px-8 rounded-xl border-2 border-[#2563eb] text-[#2563eb] text-[15px] font-semibold transition-all hover:bg-[#2563eb]/5"
          >
            Try a different URL
          </button>
        </motion.div>
      )}

      {/* ── MISMATCH WARNING ── */}
      {phase === "mismatch" && (
        <motion.div key="mismatch" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="py-6 space-y-5">
          <div className="flex items-start gap-4 rounded-2xl border-2 border-amber-200 bg-amber-50 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[16px] font-bold text-[#0f172a] mb-1">Website name mismatch</p>
              <p className="text-[13px] text-[#64748b] leading-relaxed">
                The website shows <span className="font-semibold text-[#374151]">&ldquo;{detectedSiteName}&rdquo;</span> but you entered <span className="font-semibold text-[#374151]">&ldquo;{companyName}&rdquo;</span>. Are you sure there&apos;s no mistake?
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={proceedToResults}
              className="h-[48px] w-full rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15px] font-semibold transition-all hover:-translate-y-px active:translate-y-0"
            >
              Yes, continue anyway
            </button>
            <button
              type="button"
              onClick={() => setPhase("input")}
              className="h-[48px] w-full rounded-xl border-2 border-[#e5e7eb] bg-white text-[#374151] text-[15px] font-semibold hover:border-[#2563eb]/40 transition-all"
            >
              No, let me fix it
            </button>
          </div>
        </motion.div>
      )}

      {/* ── RESULTS ── */}
      {phase === "results" && result && (
        <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
          <motion.p {...fade(0)} className="text-[14px] text-[#64748b] leading-relaxed">
            Here&apos;s what we found. Review and edit anything that doesn&apos;t look right.
          </motion.p>

          {/* Business description */}
          <motion.div {...fade(0.05)} className="rounded-xl bg-white p-4">
            <label className="mb-2 block text-sm font-semibold text-[#0f172a]">Business description</label>
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg bg-white px-3 py-2 text-[14px] text-[#0f172a] leading-relaxed outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
            />
          </motion.div>

          {/* Message tone */}
          <motion.div {...fade(0.1)} className="rounded-xl bg-white p-4">
            <label className="mb-2 block text-sm font-semibold text-[#0f172a]">Message tone</label>
            <textarea
              value={editedStyle}
              onChange={(e) => setEditedStyle(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg bg-white px-3 py-2 text-[14px] text-[#0f172a] leading-relaxed outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
            />
          </motion.div>

          <div className="h-px bg-[#e5e7eb]" />

          {/* What do you sell */}
          <motion.div {...fade(0.15)} className="space-y-3">
            <p className="text-[15px] font-semibold text-[#0f172a]">What do you sell?</p>
            {(["services", "products"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEditedBusinessType(type)}
                className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 ${editedBusinessType === type ? "border-[#2563eb] bg-blue-50" : "border-transparent bg-white hover:border-[#2563eb]/40"}`}
              >
                <div className={`h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${editedBusinessType === type ? "border-[#2563eb]" : "border-[#d1d5db]"}`}>
                  {editedBusinessType === type && <div className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />}
                </div>
                <div>
                  <p className={`text-[14px] font-semibold ${editedBusinessType === type ? "text-[#2563eb]" : "text-[#0f172a]"}`}>
                    {type === "products" ? "Products" : "Services"}
                  </p>
                  <p className="text-[12px] text-[#64748b]">
                    {type === "products" ? "Physical or digital goods" : "Consulting, contracting, etc."}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>

          {/* What you offer */}
          <motion.div {...fade(0.2)} className="rounded-xl bg-white p-4">
            <label className="mb-2 block text-sm font-semibold text-[#0f172a]">What you offer</label>
            <input
              type="text"
              value={editedWhatYouSell}
              onChange={(e) => setEditedWhatYouSell(e.target.value)}
              className="w-full rounded-lg bg-white px-3 py-2 text-[14px] text-[#0f172a] outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
            />
          </motion.div>

          {/* Confirmation */}
          <motion.label
            {...fade(0.3)}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e2e8f0] p-4 hover:bg-[#f8fafc] transition-colors"
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#2563eb] cursor-pointer"
            />
            <span className="text-[14px] text-[#374151] leading-snug">
              This looks right — use this to build my follow-up messages
            </span>
          </motion.label>

          {/* CTA */}
          <motion.div {...fade(0.35)} className="pt-1">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canContinue}
              className="h-[46px] rounded-full bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-semibold flex items-center justify-center gap-2 px-6 py-2.5 transition-all duration-150"
            >
              Continue<ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
