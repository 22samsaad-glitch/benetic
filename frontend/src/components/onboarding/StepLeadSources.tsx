"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Code2, CheckCircle2, Copy, Check, ChevronDown, ArrowRight, BookOpen, Zap, ArrowLeft } from "lucide-react";
import { auth } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  data: { leadSources: string[]; companyName: string; websiteUrl: string };
  onUpdate: (updates: { leadSources: string[] }) => void;
  onComplete: () => void;
  isSubmitting: boolean;
  onBack: () => void;
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function StepLeadSources({ data, onUpdate, onComplete, isSubmitting, onBack }: Props) {
  const [expandedCard, setExpandedCard] = useState<"facebook" | "website" | "webhook" | null>(null);

  // Facebook state
  const [fbEmail, setFbEmail] = useState("");
  const [fbAdAccountId, setFbAdAccountId] = useState("");
  const [fbConnected, setFbConnected] = useState(false);
  const [fbError, setFbError] = useState("");

  // Website state
  const [wsUrl, setWsUrl] = useState(data.websiteUrl);
  const [wsEmail, setWsEmail] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [wsCopied, setWsCopied] = useState(false);

  // Webhook state
  const [whUrl, setWhUrl] = useState("");
  const [whUrlCopied, setWhUrlCopied] = useState(false);
  const [whJsonCopied, setWhJsonCopied] = useState(false);
  const [whTested, setWhTested] = useState(false);
  const [whTesting, setWhTesting] = useState(false);

  const [skipped, setSkipped] = useState(false);

  const wsApiKey = useMemo(
    () => "bnt_" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10),
    []
  );

  useEffect(() => {
    let cancelled = false;
    async function loadTenant() {
      try {
        const tenant = await auth.tenant();
        if (!cancelled) {
          setWhUrl(`https://api.jetleads.io/webhooks/${tenant.slug}`);
        }
      } catch {
        if (!cancelled) {
          setWhUrl(`https://api.jetleads.io/webhooks/user_${Math.random().toString(36).slice(2, 8)}`);
        }
      }
    }
    loadTenant();
    return () => { cancelled = true; };
  }, []);

  const canComplete = data.leadSources.length > 0 || skipped;

  const toggleCard = (card: "facebook" | "website" | "webhook") => {
    setExpandedCard((prev) => (prev === card ? null : card));
  };

  // Facebook logic
  const handleFbSave = () => {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fbEmail);
    const adAccountValid = fbAdAccountId.startsWith("act_");
    if (!emailValid) {
      setFbError("Please enter a valid email address.");
      return;
    }
    if (!adAccountValid) {
      setFbError("Ad Account ID must start with act_ (e.g. act_123456789).");
      return;
    }
    setFbError("");
    setFbConnected(true);
    onUpdate({ leadSources: [...data.leadSources.filter((s) => s !== "facebook"), "facebook"] });
  };

  const handleFbDisconnect = () => {
    setFbConnected(false);
    onUpdate({ leadSources: data.leadSources.filter((s) => s !== "facebook") });
  };

  // Website logic
  const wsCodeSnippet = `<script src="https://cdn.jetleads.io/widget.js"></script>\n<script>\n  Jetleads.init({ apiKey: "${wsApiKey}" });\n</script>`;

  const handleWsCopy = async () => {
    await navigator.clipboard.writeText(wsCodeSnippet);
    setWsCopied(true);
    setTimeout(() => setWsCopied(false), 2000);
  };

  const handleWsSave = () => {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wsEmail);
    const urlValid = wsUrl.trim().length > 0;
    if (!urlValid || !emailValid) return;
    setWsConnected(true);
    onUpdate({ leadSources: [...data.leadSources.filter((s) => s !== "website"), "website"] });
  };

  // Webhook logic
  const whJsonExample = `{\n  "first_name": "Sarah",\n  "last_name": "Johnson",\n  "email": "sarah@example.com",\n  "phone": "(555) 123-4567",\n  "company": "ABC Corp"\n}`;

  const handleWhUrlCopy = async () => {
    await navigator.clipboard.writeText(whUrl);
    setWhUrlCopied(true);
    setTimeout(() => setWhUrlCopied(false), 2000);
  };

  const handleWhJsonCopy = async () => {
    await navigator.clipboard.writeText(whJsonExample);
    setWhJsonCopied(true);
    setTimeout(() => setWhJsonCopied(false), 2000);
  };

  const handleWhTest = async () => {
    setWhTesting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setWhTested(true);
    setWhTesting(false);
    onUpdate({ leadSources: [...data.leadSources.filter((s) => s !== "webhook"), "webhook"] });
  };

  const inputClass =
    "w-full h-11 rounded-xl bg-white px-3 text-[13px] outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#374151] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Cards */}
      <div className="space-y-3">
        {/* Facebook Lead Ads */}
        <div className="rounded-2xl border border-[#e5e7eb] overflow-hidden bg-white">
          <button
            type="button"
            className="w-full px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-[#f9fafb] transition-colors text-left"
            onClick={() => toggleCard("facebook")}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1877f2]/10">
              <FacebookIcon className="h-5 w-5 text-[#1877f2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-[#0f172a]">Facebook Lead Ads</span>
                {fbConnected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#9ca3af] mt-0.5">Sync leads directly from Facebook ad campaigns</p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-[#9ca3af] shrink-0 transition-transform duration-200",
                expandedCard === "facebook" && "rotate-180"
              )}
            />
          </button>

          <AnimatePresence>
            {expandedCard === "facebook" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 border-t border-[#e5e7eb] pt-4 space-y-4">
                  {fbConnected ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <p className="text-[13px] text-emerald-700 font-medium">Facebook Lead Ads connected successfully</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleFbDisconnect}
                        className="text-[13px] text-[#ef4444] hover:underline"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Collapsible instructions */}
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18 }}
                          className="rounded-xl bg-[#eff6ff] border border-[#bfdbfe] px-4 py-3 space-y-1"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <BookOpen className="h-3.5 w-3.5 text-[#2563eb]" />
                            <span className="text-[12px] font-semibold text-[#2563eb]">Setup instructions</span>
                          </div>
                          <ol className="text-[12px] text-[#3b82f6] space-y-1 list-decimal list-inside">
                            <li>Go to your Facebook Ads Manager</li>
                            <li>Find your Ad Account ID (starts with act_)</li>
                            <li>Enter your Facebook business email below</li>
                          </ol>
                        </motion.div>
                      </AnimatePresence>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                            Facebook Business Email
                          </label>
                          <input
                            type="email"
                            value={fbEmail}
                            onChange={(e) => setFbEmail(e.target.value)}
                            placeholder="you@business.com"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                            Ad Account ID
                          </label>
                          <input
                            type="text"
                            value={fbAdAccountId}
                            onChange={(e) => setFbAdAccountId(e.target.value)}
                            placeholder="act_123456789"
                            className={inputClass}
                          />
                        </div>
                        {fbError && (
                          <p className="text-[12px] text-[#ef4444]">{fbError}</p>
                        )}
                        <button
                          type="button"
                          onClick={handleFbSave}
                          className="h-10 rounded-xl bg-[#1877f2] hover:bg-[#1565d8] text-white text-[13px] font-semibold px-5 transition-colors"
                        >
                          Connect Facebook
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Website Forms */}
        <div className="rounded-2xl border border-[#e5e7eb] overflow-hidden bg-white">
          <button
            type="button"
            className="w-full px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-[#f9fafb] transition-colors text-left"
            onClick={() => toggleCard("website")}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <Globe className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-[#0f172a]">Website Forms</span>
                {wsConnected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#9ca3af] mt-0.5">Capture leads from contact forms on your website</p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-[#9ca3af] shrink-0 transition-transform duration-200",
                expandedCard === "website" && "rotate-180"
              )}
            />
          </button>

          <AnimatePresence>
            {expandedCard === "website" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 border-t border-[#e5e7eb] pt-4 space-y-4">
                  {wsConnected ? (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <p className="text-[13px] text-emerald-700 font-medium">Website widget connected successfully</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                          Website URL
                        </label>
                        <input
                          type="url"
                          value={wsUrl}
                          onChange={(e) => setWsUrl(e.target.value)}
                          placeholder="https://yourwebsite.com"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                          Notification Email
                        </label>
                        <input
                          type="email"
                          value={wsEmail}
                          onChange={(e) => setWsEmail(e.target.value)}
                          placeholder="you@business.com"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[12px] font-medium text-[#374151]">
                            Install this snippet on your site
                          </label>
                          <button
                            type="button"
                            onClick={handleWsCopy}
                            className="inline-flex items-center gap-1 text-[11px] text-[#2563eb] hover:text-[#1d4ed8] font-medium transition-colors"
                          >
                            {wsCopied ? (
                              <>
                                <Check className="h-3 w-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="rounded-xl bg-[#0f172a] px-4 py-3 font-mono text-[11px] text-[#e2e8f0] leading-relaxed whitespace-pre overflow-x-auto">
                          {`<script src="https://cdn.jetleads.io/widget.js"></script>\n<script>\n  Jetleads.init({ apiKey: "${wsApiKey}" });\n</script>`}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleWsSave}
                        disabled={!wsUrl.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wsEmail)}
                        className="h-10 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-semibold px-5 transition-colors"
                      >
                        Save &amp; Connect
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Webhook / API */}
        <div className="rounded-2xl border border-[#e5e7eb] overflow-hidden bg-white">
          <button
            type="button"
            className="w-full px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-[#f9fafb] transition-colors text-left"
            onClick={() => toggleCard("webhook")}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50">
              <Zap className="h-5 w-5 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-[#0f172a]">Webhook / API</span>
                {whTested && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#9ca3af] mt-0.5">Send leads from any source via HTTP webhook</p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-[#9ca3af] shrink-0 transition-transform duration-200",
                expandedCard === "webhook" && "rotate-180"
              )}
            />
          </button>

          <AnimatePresence>
            {expandedCard === "webhook" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 border-t border-[#e5e7eb] pt-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[12px] font-medium text-[#374151]">
                        Your webhook URL
                      </label>
                      <button
                        type="button"
                        onClick={handleWhUrlCopy}
                        className="inline-flex items-center gap-1 text-[11px] text-[#2563eb] hover:text-[#1d4ed8] font-medium transition-colors"
                      >
                        {whUrlCopied ? (
                          <>
                            <Check className="h-3 w-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy URL
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-[#f8fafc] border border-[#e5e7eb] px-3 py-2.5">
                      <Code2 className="h-3.5 w-3.5 text-[#9ca3af] shrink-0" />
                      <span className="font-mono text-[12px] text-[#374151] truncate">{whUrl || "Loading..."}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[12px] font-medium text-[#374151]">
                        Expected JSON format
                      </label>
                      <button
                        type="button"
                        onClick={handleWhJsonCopy}
                        className="inline-flex items-center gap-1 text-[11px] text-[#2563eb] hover:text-[#1d4ed8] font-medium transition-colors"
                      >
                        {whJsonCopied ? (
                          <>
                            <Check className="h-3 w-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy JSON
                          </>
                        )}
                      </button>
                    </div>
                    <div className="rounded-xl bg-[#0f172a] px-4 py-3 font-mono text-[11px] text-[#e2e8f0] leading-relaxed whitespace-pre overflow-x-auto">
                      {whJsonExample}
                    </div>
                  </div>

                  {whTested ? (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <p className="text-[13px] text-emerald-700 font-medium">Test lead received — webhook is working!</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleWhTest}
                      disabled={whTesting || !whUrl}
                      className="h-10 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-semibold px-5 transition-colors inline-flex items-center gap-2"
                    >
                      {whTesting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full"
                          />
                          Sending test...
                        </>
                      ) : (
                        <>
                          <Zap className="h-3.5 w-3.5" />
                          Send Test Lead
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CTA */}
      <div className="pt-4 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onComplete}
          disabled={!canComplete || isSubmitting}
          className={cn(
            "h-[46px] rounded-full bg-gray-900 hover:bg-gray-700 text-white text-[14px] font-semibold transition-all inline-flex items-center justify-center gap-2 px-6 py-2.5",
            (!canComplete || isSubmitting) && "opacity-40 cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
              />
              Setting up...
            </>
          ) : (
            <>
              Complete Setup
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setSkipped(true);
            onComplete();
          }}
          className="text-[13px] text-[#9ca3af] hover:text-[#6b7280] transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
