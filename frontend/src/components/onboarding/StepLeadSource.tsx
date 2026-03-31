"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Code2, Copy, Check, ArrowRight, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactConfetti from "react-confetti";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/api";

/* ─── Facebook SVG ──────────────────────────────────────────────────────── */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/* ─── Types ─────────────────────────────────────────────────────────────── */
type SourceId = "facebook" | "website" | "webhook";

interface TenantInfo {
  slug: string;
  webhook_key: string;
}

interface StepLeadSourceProps {
  onComplete: () => void;
  completed: boolean;
}

/* ─── Source definitions ─────────────────────────────────────────────────── */
const SOURCES = [
  {
    id: "facebook" as SourceId,
    Icon: FacebookIcon,
    title: "Facebook Lead Ads",
    description: "Automatically capture leads when someone fills out your Facebook lead form",
    iconClass: "bg-[#1877f2]/10 text-[#1877f2]",
    cta: "Connect Facebook",
  },
  {
    id: "website" as SourceId,
    Icon: Globe,
    title: "Website Form",
    description: "Add a code snippet to your form — leads auto-capture on every submission",
    iconClass: "bg-violet-500/10 text-violet-600",
    cta: "Connect Website Form",
  },
  {
    id: "webhook" as SourceId,
    Icon: Code2,
    title: "Webhook / API",
    description: "Send leads from any tool via a secure HTTP endpoint",
    iconClass: "bg-emerald-500/10 text-emerald-600",
    cta: "Get Webhook URL",
  },
];

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function StepLeadSource({ onComplete, completed }: StepLeadSourceProps) {
  const [expanded, setExpanded] = useState<SourceId | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [copied, setCopied] = useState<"url" | "key" | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);

  // Facebook sub-form
  const [fbEmail, setFbEmail] = useState("");
  const [fbAdAccountId, setFbAdAccountId] = useState("");

  // Website sub-form
  const [siteUrl, setSiteUrl] = useState("");
  const [notifEmail, setNotifEmail] = useState("");

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch real tenant slug + webhook key
  useEffect(() => {
    auth.tenant()
      .then((t) => setTenant({ slug: t.slug, webhook_key: t.webhook_key }))
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (completed) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(t);
    }
  }, [completed]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.jetleads.io";
  const webhookUrl = tenant
    ? `${apiBase}/api/v1/webhooks/ingest/${tenant.slug}`
    : `${apiBase}/api/v1/webhooks/ingest/your-slug`;

  const handleCopy = (field: "url" | "key") => {
    const text = field === "url" ? webhookUrl : (tenant?.webhook_key ?? "");
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  /* ── Success state ────────────────────────────────────────────────────── */
  if (completed) {
    return (
      <div className="space-y-8">
        {showConfetti && (
          <ReactConfetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={300}
            gravity={0.15}
            colors={["#126dfb", "#10b981", "#8b5cf6", "#f59e0b"]}
            style={{ position: "fixed", top: 0, left: 0, zIndex: 100, pointerEvents: "none" }}
          />
        )}

        <div className="text-center space-y-5">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-100"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-2"
          >
            <p className="text-4xl mb-3">🎉</p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">You&apos;re all set!</h2>
            <p className="text-[15px] text-[#64748b] mt-2 leading-relaxed max-w-sm mx-auto">Your automated follow-up system is ready. Every new lead will now be contacted automatically.</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="space-y-3"
        >
          <Link href="/leads">
            <Button className="w-full h-12 rounded-xl font-semibold text-base">
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/integrations">
            <Button variant="outline" className="w-full h-12 rounded-xl font-medium">
              Manage Integrations
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  /* ── Lead source selection ────────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {SOURCES.map(({ id, Icon, title, description, iconClass, cta }) => {
        const isExpanded = expanded === id;
        return (
          <div
            key={id}
            className={cn(
              "rounded-2xl border overflow-hidden bg-card transition-all duration-200",
              isExpanded ? "border-primary ring-1 ring-primary/20" : "border-border"
            )}
          >
            {/* Source header */}
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : id)}
              className={cn(
                "w-full flex items-center gap-4 p-5 text-left transition-all duration-150",
                isExpanded
                  ? "bg-accent/20"
                  : "hover:bg-muted/40 hover:-translate-y-0.5 active:translate-y-0"
              )}
            >
              <div className={cn("shrink-0 w-11 h-11 rounded-xl flex items-center justify-center", iconClass)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
              </div>
              <span className={cn(
                "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap",
                isExpanded
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}>
                {isExpanded ? "Hide" : cta}
              </span>
            </button>

            {/* Expanded panel */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border/50 p-5 space-y-4 bg-background/60">

                    {/* ── Facebook ── */}
                    {id === "facebook" && (
                      <>
                        <p className="text-xs text-muted-foreground leading-relaxed bg-muted/60 rounded-xl px-3 py-2.5">
                          We&apos;ll connect to your Facebook Ads account and automatically capture new leads the moment someone fills out your lead form ad.
                        </p>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Facebook account email</Label>
                          <Input
                            value={fbEmail}
                            onChange={(e) => setFbEmail(e.target.value)}
                            placeholder="you@example.com"
                            type="email"
                            className="h-10 text-sm rounded-xl bg-card"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">
                            Ad Account ID
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional — we&apos;ll help you find it)</span>
                          </Label>
                          <Input
                            value={fbAdAccountId}
                            onChange={(e) => setFbAdAccountId(e.target.value)}
                            placeholder="act_1234567890"
                            className="h-10 text-sm rounded-xl bg-card font-mono"
                          />
                        </div>
                        <Button
                          onClick={onComplete}
                          disabled={!fbEmail.trim()}
                          className="w-full h-10 rounded-xl font-semibold"
                        >
                          Connect Facebook
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </>
                    )}

                    {/* ── Website Form ── */}
                    {id === "website" && (
                      <>
                        <p className="text-xs text-muted-foreground leading-relaxed bg-muted/60 rounded-xl px-3 py-2.5">
                          We&apos;ll give you a small code snippet to add to your website form. When someone submits, we capture their info and start your follow-up sequence automatically.
                        </p>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Website URL</Label>
                          <Input
                            value={siteUrl}
                            onChange={(e) => setSiteUrl(e.target.value)}
                            placeholder="https://yourwebsite.com/contact"
                            type="url"
                            className="h-10 text-sm rounded-xl bg-card"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Notification email</Label>
                          <Input
                            value={notifEmail}
                            onChange={(e) => setNotifEmail(e.target.value)}
                            placeholder="you@example.com"
                            type="email"
                            className="h-10 text-sm rounded-xl bg-card"
                          />
                        </div>
                        <Button
                          onClick={onComplete}
                          disabled={!siteUrl.trim() || !notifEmail.trim()}
                          className="w-full h-10 rounded-xl font-semibold"
                        >
                          Get Code Snippet
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </>
                    )}

                    {/* ── Webhook / API ── */}
                    {id === "webhook" && (
                      <>
                        <p className="text-xs text-muted-foreground leading-relaxed bg-muted/60 rounded-xl px-3 py-2.5">
                          POST lead data to this URL from Zapier, Make, your CRM, or any custom code. Accepts JSON with{" "}
                          <code className="font-mono bg-muted px-1 py-0.5 rounded">name</code>,{" "}
                          <code className="font-mono bg-muted px-1 py-0.5 rounded">email</code>,{" "}
                          <code className="font-mono bg-muted px-1 py-0.5 rounded">phone</code>,{" "}
                          <code className="font-mono bg-muted px-1 py-0.5 rounded">company</code>.
                          At least <code className="font-mono bg-muted px-1 py-0.5 rounded">email</code> or{" "}
                          <code className="font-mono bg-muted px-1 py-0.5 rounded">phone</code> required.
                        </p>

                        {/* Endpoint URL */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Endpoint URL</Label>
                          <div className="flex gap-2">
                            <div className="flex-1 h-10 rounded-xl border border-border bg-muted px-3 flex items-center overflow-hidden">
                              <span className="text-xs font-mono text-muted-foreground truncate">{webhookUrl}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy("url")}
                              className={cn(
                                "shrink-0 h-10 w-10 rounded-xl border flex items-center justify-center transition-colors",
                                copied === "url"
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                              )}
                            >
                              {copied === "url" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* API Key */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">
                            API Key
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">(send as X-API-Key header)</span>
                          </Label>
                          <div className="flex gap-2">
                            <div className="flex-1 h-10 rounded-xl border border-border bg-muted px-3 flex items-center overflow-hidden">
                              <span className="text-xs font-mono text-muted-foreground truncate">
                                {tenant ? tenant.webhook_key : "Loading..."}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy("key")}
                              disabled={!tenant}
                              className={cn(
                                "shrink-0 h-10 w-10 rounded-xl border flex items-center justify-center transition-colors",
                                copied === "key"
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40"
                              )}
                            >
                              {copied === "key" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Example request */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Example request</Label>
                          <pre className="text-[11px] bg-muted rounded-xl p-3 border border-border font-mono text-muted-foreground overflow-x-auto leading-relaxed whitespace-pre">{`POST ${webhookUrl}
X-API-Key: ${tenant?.webhook_key ?? "your-api-key"}
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1 555 000 0000",
  "company": "Acme Inc"
}`}</pre>
                        </div>

                        <Button
                          onClick={onComplete}
                          className="w-full h-10 rounded-xl font-semibold"
                        >
                          Done — I&apos;ve set up the webhook
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Later option */}
      <button
        type="button"
        onClick={onComplete}
        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-dashed border-border bg-card text-left hover:border-muted-foreground/40 hover:bg-muted/30 transition-all duration-150"
      >
        <div className="shrink-0 w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-lg">
          ⏭
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Set up later</p>
          <p className="text-xs text-muted-foreground mt-0.5">Skip for now — connect from the Integrations page anytime</p>
        </div>
      </button>


      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <Shield className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
        <span className="text-xs text-[#374151]">
          Bank-level encryption · SOC 2 compliant · Your data is never shared
        </span>
      </div>
    </div>
  );
}
