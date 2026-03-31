"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Zap,
  BarChart3,
  Check,
  ChevronDown,
  ArrowUpRight,
  Globe,
  Moon,
  Layers,
  Shield,
  TrendingUp,
  MessageSquare,
  Bell,
  Settings,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { ElegantShape } from "@/components/ui/elegant-shape";

/* ── Design tokens ───────────────────────────────────────────────────────── */
const BLUE        = "#0454ff";
const HERO_GRAD   = "linear-gradient(180deg, #0454ff 0%, #3b82f6 50%, #93c5fd 100%)";
const CARD_SHADOW = "rgba(0,0,0,0.08) 0px 12.9979px 37.3691px 0px";
const TEXT1       = "#000000";
const TEXT2       = "#3d3d3d";
const TEXT3       = "#6d6d6d";
const BORDER      = "#eaeaea";
const SECT_BG     = "#f5f6f8";

/* ─── Section Label ──────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-[14px]">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 0L6.12 3.88L10 5L6.12 6.12L5 10L3.88 6.12L0 5L3.88 3.88L5 0Z" fill={BLUE} />
      </svg>
      <span style={{ color: BLUE }} className="text-xs uppercase tracking-widest font-semibold">{children}</span>
    </div>
  );
}

/* ─── FAQ Accordion ──────────────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}` }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left py-5 flex items-center justify-between gap-4 group"
      >
        <span style={{ color: TEXT1 }} className="text-base font-semibold group-hover:opacity-70 transition-opacity">{q}</span>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 transition-transform duration-200")}
          style={{ color: TEXT3, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p style={{ color: TEXT3 }} className="text-sm pb-5 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Dashboard Mockup ───────────────────────────────────────────────────── */
const BAR_DATA = [
  { day: "Mon", pct: 40 },
  { day: "Tue", pct: 65 },
  { day: "Wed", pct: 45 },
  { day: "Thu", pct: 80 },
  { day: "Fri", pct: 55 },
  { day: "Sat", pct: 90 },
  { day: "Sun", pct: 70 },
];

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-[1100px] mx-auto mt-24">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative rounded-2xl overflow-hidden text-left border"
        style={{
          boxShadow: "rgba(0,0,0,0.06) 0px 2px 8px 0px, rgba(0,0,0,0.1) 0px 12px 32px -4px, rgba(0,0,0,0.18) 0px 32px 80px -8px",
          borderColor: "rgba(255,255,255,0.35)",
          background: "#ffffff",
        }}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3" style={{ background: "#f9fafb", borderBottom: `1px solid ${BORDER}` }}>
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444" }} />
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#f59e0b" }} />
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#22c55e" }} />
          <div className="flex-1 mx-3 rounded" style={{ height: 18, background: "#e5e7eb", maxWidth: 320 }} />
        </div>

        {/* App header */}
        <div className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: `1px solid ${BORDER}`, background: "#fff" }}>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ background: "#0454ff" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z" fill="white" />
              </svg>
            </div>
            <span className="text-xs font-semibold" style={{ color: TEXT2 }}>Jetleads</span>
            <ChevronDown className="h-3 w-3" style={{ color: TEXT3 }} />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: SECT_BG }}>
              <Bell className="h-3 w-3" style={{ color: TEXT3 }} />
            </div>
            <div className="h-6 rounded-full flex items-center justify-center px-3 text-white text-[9px] font-semibold" style={{ background: "#0454ff", borderRadius: 100 }}>
              + New Lead
            </div>
          </div>
        </div>

        <div className="flex" style={{ minHeight: 380 }}>
          {/* Sidebar */}
          <div className="w-[148px] shrink-0 py-3 px-2" style={{ borderRight: `1px solid ${BORDER}`, background: "#fff" }}>
            <p className="text-[8px] font-semibold uppercase tracking-wider px-2 mb-2" style={{ color: TEXT3 }}>Main Menu</p>
            {[
              { label: "Dashboard", active: true  },
              { label: "Leads",     active: false },
              { label: "Sequences", active: false },
              { label: "Settings",  active: false },
            ].map((item) => (
              <div key={item.label}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg mb-0.5"
                style={{ background: item.active ? "#0454ff" : "transparent" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.active ? "rgba(255,255,255,0.8)" : "#d1d5db" }} />
                <span className="text-[10px] font-medium" style={{ color: item.active ? "#fff" : TEXT3 }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 space-y-3" style={{ background: SECT_BG }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold" style={{ color: TEXT1 }}>Dashboard</p>
                <p className="text-[10px]" style={{ color: TEXT3 }}>Welcome Back, Alex 👋</p>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium" style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT3 }}>
                Monthly <ChevronDown className="h-2.5 w-2.5 ml-1" />
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Total Leads",  val: "124", note: "All time",            blue: true  },
                { label: "In Sequence",  val: "38",  note: "Active follow-up",    blue: false },
                { label: "Responded",    val: "21",  note: "Replied to outreach", blue: false },
                { label: "Needs Review", val: "7",   note: "Awaiting review",     blue: false },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-3"
                  style={{
                    background: s.blue ? "#0454ff" : "#fff",
                    border: s.blue ? "none" : `1px solid ${BORDER}`,
                  }}>
                  <p className="text-[8px] font-medium mb-1.5 leading-tight" style={{ color: s.blue ? "rgba(255,255,255,0.7)" : TEXT3 }}>{s.label}</p>
                  <p className="text-lg font-black leading-none mb-0.5" style={{ color: s.blue ? "#fff" : TEXT1 }}>{s.val}</p>
                  <p className="text-[8px]" style={{ color: s.blue ? "rgba(255,255,255,0.5)" : TEXT3 }}>{s.note}</p>
                </div>
              ))}
            </div>

            {/* Lead Activity bar chart */}
            <div className="rounded-xl p-3" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
              <p className="text-[10px] font-semibold mb-3" style={{ color: TEXT2 }}>Lead Activity</p>
              <div className="flex items-end gap-2" style={{ height: 64 }}>
                {BAR_DATA.map((b) => (
                  <div key={b.day} className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${(b.pct / 90) * 100}%`,
                        background: b.pct === 90 ? "#0454ff" : "rgba(4,84,255,0.35)",
                        minHeight: 4,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                {BAR_DATA.map((b) => (
                  <div key={b.day} className="flex-1 text-center" style={{ fontSize: 8, color: TEXT3 }}>{b.day}</div>
                ))}
              </div>
            </div>

            {/* Recent Leads */}
            <div className="rounded-xl p-3" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
              <p className="text-[10px] font-semibold mb-2.5" style={{ color: TEXT2 }}>Recent Leads</p>
              <div className="space-y-2">
                {[
                  { name: "James R.", email: "james@gmail.com", status: "Qualified",    bg: "#dcfce7", fg: "#16a34a" },
                  { name: "Maria S.", email: "maria@gmail.com", status: "In Sequence",  bg: "#dbeafe", fg: "#0454ff" },
                  { name: "Tom W.",   email: "tom@gmail.com",   status: "Needs Review", bg: "#fef9c3", fg: "#a16207" },
                ].map((lead) => (
                  <div key={lead.name} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: SECT_BG }}>
                        <span className="text-[7px] font-bold" style={{ color: TEXT3 }}>{lead.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold leading-tight" style={{ color: TEXT2 }}>{lead.name}</p>
                        <p className="text-[8px]" style={{ color: TEXT3 }}>{lead.email}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: lead.bg, color: lead.fg }}>
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Data ───────────────────────────────────────────────────────────────── */
const companies = [
  "Thumbtack", "Angi", "HomeAdvisor", "ServiceTitan",
  "HubSpot", "Salesforce", "Mailchimp", "ActiveCampaign", "Intercom",
  "Thumbtack", "Angi", "HomeAdvisor", "ServiceTitan",
  "HubSpot", "Salesforce", "Mailchimp", "ActiveCampaign", "Intercom",
];

const features = [
  { icon: Zap,           title: "5-Minute Contact",         desc: "The moment a lead submits a form, Jetleads sends them a text AND email within 5 minutes. Automatically, every time." },
  { icon: MessageSquare, title: "Automatic Follow-Up",      desc: "If they don't respond, Jetleads follows up at 24 hours, 3 days, and 7 days. Then marks them unresponsive. You write the messages once." },
  { icon: Globe,         title: "Any Lead Source",          desc: "Connect Facebook Ads or your website form via webhook. Leads flow in automatically." },
  { icon: Settings,      title: "10-Minute Setup",          desc: "Paste your website URL. We extract your service area and job types. Confirm the rules. Done — your system is live." },
];

const benefits = [
  { icon: Zap,        title: "5-Minute Response",       desc: "Studies show 78% of jobs go to the first contractor who responds. Jetleads makes sure that's you." },
  { icon: Bell,       title: "Zero Leads Dropped",      desc: "Every lead that comes in — Facebook, website, anywhere — gets contacted. No exceptions." },
  { icon: TrendingUp, title: "More Jobs Booked",        desc: "Faster response + consistent follow-up = more estimates booked. Simple math." },
  { icon: Moon,       title: "Works While You Sleep",   desc: "Leads come in at 11pm. Jetleads texts them at 11pm. You sleep. They're waiting for you in the morning." },
  { icon: Layers,     title: "Built for Contractors",   desc: "Roofing, HVAC, plumbing, solar — if you get leads from forms or Facebook Ads, Jetleads is built for you." },
  { icon: Shield,     title: "Qualify Before You Call", desc: "Jetleads checks if the lead is in your service area and does the right job type — before starting any follow-up." },
];

const integrations = [
  { name: "Facebook Ads", bg: "#1877f2", letter: "f"   },
  { name: "HubSpot",      bg: "#ff7a59", letter: "H"   },
  { name: "Zapier",       bg: "#ff4a00", letter: "Z"   },
  { name: "Salesforce",   bg: "#00a1e0", letter: "S"   },
  { name: "Mailchimp",    bg: "#ffe01b", letter: "M", dark: true },
  { name: "Webhooks",     bg: "#3d3d3d", letter: "</>" },
];

const testimonials = [
  { name: "Jason Miller",    role: "Owner, Miller Roofing",        quote: "We went from responding to leads in 2 days to 2 minutes. Our book rate tripled in the first month.",                  avatar: "JM" },
  { name: "Sarah Chen",      role: "Owner, Chen HVAC",             quote: "Jetleads follows up while I'm on the job. I'm not losing leads to competitors anymore.",                               avatar: "SC" },
  { name: "Marcus Thompson", role: "CEO, Thompson Solar",          quote: "I was skeptical but the ROI was immediate. We closed 3 deals in the first week from leads that would have gone cold.", avatar: "MT" },
  { name: "Priya Sharma",    role: "Owner, Sharma Plumbing",       quote: "Setup took 10 minutes. Now every lead gets a text and email automatically. I've booked 40% more jobs this quarter.",   avatar: "PS" },
  { name: "David Torres",    role: "Founder, Apex Solar",          quote: "Every solar lead gets a personalized follow-up immediately. Our conversion rate is up 40% since switching.",            avatar: "DT" },
];

const faqs = [
  { q: "How does Jetleads contact my leads?",      a: "When a lead submits a form, Jetleads sends them a text message AND email within 5 minutes using the templates you wrote during setup." },
  { q: "What if a lead doesn't respond?",          a: "Jetleads automatically follows up at 24 hours, 3 days, and 7 days. After the final follow-up with no response, the lead is marked Unresponsive." },
  { q: "Do I write the messages?",                 a: "Yes — you write your message templates once during onboarding. Jetleads sends those exact messages with your lead's name and other details filled in." },
  { q: "What lead sources does Jetleads support?", a: "Facebook Lead Ads and any website form via webhook. If your form can send a POST request, Jetleads can receive it." },
  { q: "What is the qualification system?",        a: "When you sign up, you paste your website URL. Jetleads reads your site and extracts your service area and job types. When a lead comes in, it checks if they match. Unqualified leads get a single polite message and are marked Disqualified." },
  { q: "Can I cancel anytime?",                    a: "Yes. No contracts, no cancellation fees. Cancel any time from your account settings." },
];

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [billingYearly, setBillingYearly] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/leads");
  }, [loading, user, router]);

  if (loading || user) return null;

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden" style={{ background: "#fff" }}>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <header className="absolute top-0 left-0 right-0 z-30" style={{ background: "transparent" }}>
        <nav className="flex items-center justify-between px-10 mx-auto" style={{ maxWidth: 1280, height: 84 }}>
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z" fill="white" />
            </svg>
            <span className="font-bold text-[24px] tracking-tight text-white">Jetleads</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {[
              { label: "Home",     href: "/" },
              { label: "Features", href: "#features" },
              { label: "Pricing",  href: "#pricing" },
              { label: "FAQ",      href: "#faq" },
            ].map((item) => (
              <a key={item.label} href={item.href}
                className="text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "rgba(255,255,255,0.85)" }}>
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-5">
            <Link href="/login" className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: "rgba(255,255,255,0.75)" }}>
              Log in
            </Link>
            <Link href="/register"
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "#000", color: "#fff", borderRadius: 100, padding: "10px 22px" }}>
              Get started <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <button type="button" className="md:hidden p-1 text-white"
            onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="md:hidden px-6 py-4 space-y-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.15)", background: "rgba(4,84,255,0.9)", backdropFilter: "blur(16px)" }}
            >
              {["Features", "Pricing", "FAQ"].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium py-1" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {item}
                </a>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/login" className="text-sm font-medium py-1" style={{ color: "rgba(255,255,255,0.7)" }}>Log in</Link>
                <Link href="/register" className="text-sm font-semibold text-white text-center py-2.5"
                  style={{ background: TEXT1, borderRadius: 100 }}>
                  Get started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0454ff 0%, #0454ff 40%, #ffffff 60%, #ffffff 100%)", paddingTop: 172, paddingBottom: 0 }}>

        {/* Symmetric lighter wash — both left and right corners */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 50% 70% at 0% 30%, rgba(130,185,255,0.55) 0%, transparent 65%)" }} />
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 50% 70% at 100% 30%, rgba(130,185,255,0.55) 0%, transparent 65%)" }} />
        {/* Slight white center top glow */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 30% at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 70%)" }} />

        {/* ElegantShape floating shapes */}
        <ElegantShape delay={0.3} width={600} height={140} rotate={12}  gradient="from-white/[0.12]" className="left-[-8%] top-[18%]" />
        <ElegantShape delay={0.5} width={500} height={120} rotate={-15} gradient="from-white/[0.08]"  className="right-[-4%] top-[65%]" />
        <ElegantShape delay={0.4} width={300} height={80}  rotate={-8}  gradient="from-blue-200/[0.15]" className="left-[8%] bottom-[12%]" />
        <ElegantShape delay={0.6} width={200} height={60}  rotate={20}  gradient="from-white/[0.10]"  className="right-[18%] top-[12%]" />
        <ElegantShape delay={0.7} width={150} height={40}  rotate={-25} gradient="from-blue-100/[0.12]" className="left-[22%] top-[8%]" />

        {/* Hero content */}
        <div className="relative z-10 text-center px-6 mx-auto" style={{ maxWidth: 840 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 mb-8">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 0L7.94 5.06L13 6.5L7.94 7.94L6.5 13L5.06 7.94L0 6.5L5.06 5.06L6.5 0Z" fill="white" />
                </svg>
                <span className="text-sm font-medium text-white tracking-wide">5-Minute Lead Response</span>
              </div>
            </div>

            {/* Headline */}
            <h1
              className="text-white leading-[1.05] mb-6"
              style={{
                fontSize: 64,
                fontWeight: 600,
                letterSpacing: "-2px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Contact every lead<br />in 5 minutes.
            </h1>

            {/* Subheading */}
            <p
              className="mx-auto mb-10"
              style={{ fontSize: 16, fontWeight: 400, color: "rgba(255,255,255,0.78)", lineHeight: 1.65, maxWidth: 500 }}
            >
              Jetleads contacts your contractor leads within 5 minutes of them coming in — automatically, every time. No more slow follow-up. No more lost jobs.
            </p>

            {/* Email pill CTA */}
            <form
              onSubmit={(e) => { e.preventDefault(); router.push(`/register?email=${encodeURIComponent(email)}`); }}
              className="flex items-center mx-auto"
              style={{
                background: "#fff",
                borderRadius: 100,
                maxWidth: 460,
                padding: "5px 5px 5px 20px",
                boxShadow: "rgba(0,0,0,0.12) 0px 4px 16px 0px, rgba(255,255,255,0.2) 0px 0px 0px 1px",
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your Email"
                className="flex-1 bg-transparent outline-none min-w-0"
                style={{ fontSize: 15, color: TEXT1 }}
              />
              <button
                type="submit"
                className="shrink-0 text-white font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ background: "#000", borderRadius: 100, padding: "11px 24px" }}
              >
                Get started
              </button>
            </form>
          </motion.div>

          {/* Mockup */}
          <DashboardMockup />
        </div>

      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" style={{ background: SECT_BG, padding: "120px 40px" }}>
        <div className="mx-auto" style={{ maxWidth: 1280 }}>
          <SectionLabel>Features</SectionLabel>
          <h2 className="font-bold text-center mb-4 leading-tight"
            style={{ fontSize: 56, fontWeight: 600, color: TEXT1, letterSpacing: "-1px" }}>
            Smarter Tools to Accelerate<br />Your Growth
          </h2>
          <p className="text-center mb-14 mx-auto" style={{ fontSize: 16, fontWeight: 400, color: TEXT3, maxWidth: 520 }}>
            Everything you need to follow up faster, convert more leads, and close deals — without hiring more staff.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  style={{ background: "#fff", borderRadius: 16, padding: 30, boxShadow: CARD_SHADOW }}
                >
                  <div className="w-10 h-10 flex items-center justify-center mb-5 rounded-xl" style={{ background: "#ebf1ff", borderRadius: 12 }}>
                    <Icon className="h-5 w-5" style={{ color: BLUE }} />
                  </div>
                  <h3 className="font-bold mb-2" style={{ fontSize: 18, color: TEXT1 }}>{f.title}</h3>
                  <p style={{ fontSize: 16, fontWeight: 400, color: TEXT3, lineHeight: 1.6 }}>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: "#fff", padding: "120px 40px" }}>
        <div className="mx-auto" style={{ maxWidth: 1280 }}>
          <SectionLabel>Pricing Plans</SectionLabel>
          <h2 className="font-bold text-center mb-4 leading-tight"
            style={{ fontSize: 56, fontWeight: 600, color: TEXT1, letterSpacing: "-1px" }}>
            Simple, Transparent Pricing
          </h2>
          <p className="text-center mb-8 mx-auto" style={{ fontSize: 16, fontWeight: 400, color: TEXT3, maxWidth: 480 }}>
            Start free for 14 days. No hidden fees, no per-seat surprises.
          </p>

          <div className="flex items-center justify-center gap-3 mb-12">
            <span className="text-sm font-medium" style={{ color: !billingYearly ? TEXT1 : TEXT3 }}>Monthly</span>
            <button type="button" onClick={() => setBillingYearly(!billingYearly)}
              className="relative w-11 h-6 rounded-full transition-colors duration-200"
              style={{ background: billingYearly ? BLUE : BORDER }}>
              <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: billingYearly ? "translateX(20px)" : "translateX(0)" }} />
            </button>
            <span className="text-sm font-medium" style={{ color: billingYearly ? TEXT1 : TEXT3 }}>
              Yearly
              <span className="ml-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#ebfbee", color: "#16a34a" }}>Save 20%</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="p-8 transition-shadow hover:shadow-lg"
              style={{ background: "#fff", borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: "rgba(0,0,0,0.05) 0px 4px 16px 0px" }}>
              <p className="text-sm font-semibold mb-1" style={{ color: TEXT3 }}>Starter</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="font-black" style={{ fontSize: 48, color: TEXT1, letterSpacing: "-1px", lineHeight: 1 }}>
                  ${billingYearly ? "79" : "99"}
                </span>
                <span className="mb-2" style={{ fontSize: 14, color: TEXT3 }}>/mo</span>
              </div>
              <p className="mb-7" style={{ fontSize: 12, color: TEXT3 }}>{billingYearly ? "Billed annually" : "Billed monthly"}</p>
              <ul className="space-y-3 mb-8">
                {["Up to 500 leads/mo", "Email sequences", "1 lead source", "Basic analytics", "Email support"].map((ft) => (
                  <li key={ft} className="flex items-center gap-2.5" style={{ fontSize: 14, color: TEXT2 }}>
                    <Check className="h-4 w-4 shrink-0" style={{ color: BLUE }} />{ft}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full text-center text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ borderRadius: 100, border: `1.5px solid ${BORDER}`, padding: "12px 0", color: TEXT1 }}>
                Start free trial
              </Link>
            </div>

            {/* Pro — featured */}
            <div className="p-8 transition-shadow hover:shadow-2xl hover:-translate-y-1 duration-200 relative overflow-hidden"
              style={{
                background: "linear-gradient(224deg, rgb(0,85,255) 5%, rgb(70,143,255) 43%, rgb(23,143,255) 100%)",
                borderRadius: 16,
                boxShadow: CARD_SHADOW,
              }}>
              <div className="absolute top-5 right-5 text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                POPULAR
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.75)" }}>Pro</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="font-black text-white" style={{ fontSize: 48, letterSpacing: "-1px", lineHeight: 1 }}>
                  ${billingYearly ? "119" : "149"}
                </span>
                <span className="mb-2" style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>/mo</span>
              </div>
              <p className="mb-7" style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{billingYearly ? "Billed annually" : "Billed monthly"}</p>
              <ul className="space-y-3 mb-8">
                {["Up to 2,000 leads/mo", "Email + SMS sequences", "Unlimited lead sources", "Advanced analytics", "Priority support", "Custom templates"].map((ft) => (
                  <li key={ft} className="flex items-center gap-2.5 text-white" style={{ fontSize: 14 }}>
                    <Check className="h-4 w-4 shrink-0 text-white/80" />{ft}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full text-center text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: "#fff", borderRadius: 100, padding: "12px 0", color: BLUE }}>
                Start free trial
              </Link>
            </div>

            {/* Business */}
            <div className="p-8 transition-shadow hover:shadow-lg"
              style={{ background: "#fff", borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: "rgba(0,0,0,0.05) 0px 4px 16px 0px" }}>
              <p className="text-sm font-semibold mb-1" style={{ color: TEXT3 }}>Business</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="font-black" style={{ fontSize: 48, color: TEXT1, letterSpacing: "-1px", lineHeight: 1 }}>
                  ${billingYearly ? "199" : "250"}
                </span>
                <span className="mb-2" style={{ fontSize: 14, color: TEXT3 }}>/mo</span>
              </div>
              <p className="mb-7" style={{ fontSize: 12, color: TEXT3 }}>{billingYearly ? "Billed annually" : "Billed monthly"}</p>
              <ul className="space-y-3 mb-8">
                {["Unlimited leads", "Everything in Pro", "Multi-user (5 seats)", "Dedicated account manager", "API access", "Custom integrations"].map((ft) => (
                  <li key={ft} className="flex items-center gap-2.5" style={{ fontSize: 14, color: TEXT2 }}>
                    <Check className="h-4 w-4 shrink-0" style={{ color: BLUE }} />{ft}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full text-center text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ borderRadius: 100, border: `1.5px solid ${BORDER}`, padding: "12px 0", color: TEXT1 }}>
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ────────────────────────────────────────────────────────── */}
      <section style={{ background: SECT_BG, padding: "120px 40px" }}>
        <div className="mx-auto" style={{ maxWidth: 1280 }}>
          <SectionLabel>Benefits</SectionLabel>
          <h2 className="font-bold text-center mb-4 leading-tight"
            style={{ fontSize: 56, fontWeight: 600, color: TEXT1, letterSpacing: "-1px" }}>
            The Powerful Advantages<br />Your Team Gets
          </h2>
          <p className="text-center mb-14 mx-auto" style={{ fontSize: 16, fontWeight: 400, color: TEXT3, maxWidth: 480 }}>
            Not just automation — a competitive edge that pays for itself every month.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div key={b.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  style={{ background: "#fff", borderRadius: 16, padding: 30, boxShadow: CARD_SHADOW }}
                >
                  <div className="w-10 h-10 flex items-center justify-center mb-4 rounded-xl" style={{ background: "#ebf1ff", borderRadius: 12 }}>
                    <Icon className="h-5 w-5" style={{ color: BLUE }} />
                  </div>
                  <h3 className="font-bold mb-2" style={{ fontSize: 16, color: TEXT1 }}>{b.title}</h3>
                  <p style={{ fontSize: 16, fontWeight: 400, color: TEXT3, lineHeight: 1.6 }}>{b.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ────────────────────────────────────────────────────── */}
      <section id="integrations" style={{ background: "#fff", padding: "120px 40px" }}>
        <div className="mx-auto text-center" style={{ maxWidth: 1280 }}>
          <SectionLabel>Integrations</SectionLabel>
          <h2 className="font-bold mb-4 leading-tight"
            style={{ fontSize: 56, fontWeight: 600, color: TEXT1, letterSpacing: "-1px" }}>
            Connects With Your<br />Existing Stack
          </h2>
          <p className="mb-14 mx-auto" style={{ fontSize: 16, fontWeight: 400, color: TEXT3, maxWidth: 480 }}>
            Jetleads plugs into the tools you already use — no ripping and replacing required.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {integrations.map((intg) => (
              <div key={intg.name}
                className="flex flex-col items-center gap-3 p-5 transition-shadow hover:shadow-lg"
                style={{ background: "#fff", borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: "rgba(0,0,0,0.05) 0px 4px 12px 0px" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                  style={{ background: intg.bg, borderRadius: 12, color: intg.dark ? "#000" : "#fff" }}>
                  {intg.letter}
                </div>
                <span className="text-xs font-medium text-center" style={{ color: TEXT2 }}>{intg.name}</span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm" style={{ color: TEXT3 }}>Plus any source via webhook or Zapier</p>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section style={{ background: SECT_BG, padding: "120px 0" }} className="overflow-hidden">
        <div className="px-10 mb-12 text-center mx-auto" style={{ maxWidth: 1280 }}>
          <SectionLabel>Testimonials</SectionLabel>
          <h2 className="font-bold leading-tight"
            style={{ fontSize: 56, fontWeight: 600, color: TEXT1, letterSpacing: "-1px" }}>
            Loved by Contractors<br />Everywhere
          </h2>
        </div>
        <div className="relative flex overflow-hidden"
          style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
          <div className="flex gap-5 animate-marquee">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="w-72 shrink-0 p-6"
                style={{ background: "#fff", borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: "rgba(0,0,0,0.06) 0px 4px 20px 0px" }}>
                <p className="leading-relaxed mb-5 line-clamp-4" style={{ fontSize: 13, color: TEXT3 }}>"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "#ebf1ff", color: BLUE }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: TEXT1 }}>{t.name}</p>
                    <p className="text-xs" style={{ color: TEXT3 }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOG ────────────────────────────────────────────────────────────── */}
      <section style={{ background: "#fff", padding: "120px 40px" }}>
        <div className="mx-auto" style={{ maxWidth: 1280 }}>
          <SectionLabel>Blog and Insights</SectionLabel>
          <h2 className="font-bold text-center mb-14 leading-tight"
            style={{ fontSize: 56, fontWeight: 600, color: TEXT1, letterSpacing: "-1px" }}>
            Stay Ahead of the Curve
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { tag: "Sales",      title: "Why 78% of Deals Go to the First Responder",         excerpt: "Speed-to-lead is the single biggest predictor of close rate. Here's the data — and how to act on it.",   date: "Mar 15, 2026" },
              { tag: "Automation", title: "Building a 5-Touch Follow-Up Sequence That Converts", excerpt: "A proven framework for multi-step outreach that nurtures leads without being annoying.",                   date: "Mar 8, 2026"  },
              { tag: "Growth",     title: "How One Agency 3x'd Their Close Rate in 30 Days",    excerpt: "A case study on implementing automated follow-up across a 12-person sales team.",                          date: "Feb 28, 2026" },
            ].map((post, i) => (
              <motion.div key={post.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="overflow-hidden cursor-pointer transition-shadow hover:shadow-lg"
                style={{ background: "#fff", borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: "rgba(0,0,0,0.05) 0px 4px 16px 0px" }}
              >
                <div className="h-36 flex items-center justify-center"
                  style={{ background: "linear-gradient(131deg, #f5f6f8 0%, #dde1e7 3%, #f5f6f8 46%, #fff 55%, #f5f6f8 100%)" }}>
                  <BarChart3 className="h-10 w-10" style={{ color: "#c0c7d4" }} />
                </div>
                <div className="p-5">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 mb-3"
                    style={{ background: "#ebf1ff", color: BLUE, borderRadius: 100 }}>
                    {post.tag}
                  </span>
                  <h3 className="font-bold mb-2 leading-snug" style={{ fontSize: 14, color: TEXT1 }}>{post.title}</h3>
                  <p className="leading-relaxed mb-3" style={{ fontSize: 12, color: TEXT3 }}>{post.excerpt}</p>
                  <p style={{ fontSize: 11, color: TEXT3 }}>{post.date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ background: SECT_BG, padding: "120px 40px" }}>
        <div className="mx-auto" style={{ maxWidth: 680 }}>
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="font-bold text-center mb-12 leading-tight"
            style={{ fontSize: 56, fontWeight: 600, color: TEXT1, letterSpacing: "-1px" }}>
            Frequently Asked<br />Questions
          </h2>
          {faqs.map((faq) => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── FOOTER CTA ──────────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(224deg, rgb(0,85,255) 5%, rgb(70,143,255) 43%, rgb(23,143,255) 100%)", padding: "120px 40px" }}>
        <div className="mx-auto text-center" style={{ maxWidth: 700 }}>
          <h2 className="text-white mb-5 leading-tight"
            style={{ fontSize: 56, fontWeight: 600, letterSpacing: "-1px" }}>
            Stop losing jobs to<br />slow follow-up.
          </h2>
          <p className="text-white/75 mb-10 mx-auto" style={{ fontSize: 16, fontWeight: 400, maxWidth: 480 }}>
            Contact every lead in 5 minutes. Automatically.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 text-base font-bold transition-opacity hover:opacity-90"
            style={{ background: "#fff", color: BLUE, borderRadius: 100, padding: "14px 36px",
              boxShadow: "rgba(0,0,0,0.12) 0px 4px 16px 0px" }}>
            Start your free trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>14-day free trial · No credit card required</p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#111", padding: "80px 40px 40px" }}>
        <div className="mx-auto" style={{ maxWidth: 1280 }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z" fill="#0454ff" />
                </svg>
                <span className="font-bold text-[16px] text-white">Jetleads</span>
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "#828181" }}>
                Automated lead follow-up for contractors. Close more jobs without more headcount.
              </p>
              <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: "#1a1a1a", borderRadius: 100 }}>
                <input type="email" placeholder="Your email"
                  className="flex-1 bg-transparent text-sm outline-none min-w-0" style={{ color: "#828181" }} />
                <button type="button" className="text-white text-xs font-semibold px-3 py-1.5 transition-opacity hover:opacity-80"
                  style={{ background: BLUE, borderRadius: 100 }}>
                  Subscribe
                </button>
              </div>
            </div>
            {[
              { title: "Product",  items: ["Features", "Pricing", "Integrations", "Changelog", "Roadmap"] },
              { title: "Company",  items: ["About", "Blog", "Careers", "Press", "Contact"] },
              { title: "Legal",    items: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR", "Security"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white text-sm font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item}>
                      <a href="#" className="text-sm transition-colors hover:text-white" style={{ color: "#828181" }}>{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-3" style={{ borderTop: "1px solid #222", paddingTop: 24 }}>
            <p className="text-xs" style={{ color: "#828181" }}>© 2026 Jetleads. All rights reserved.</p>
            <div className="flex items-center gap-5">
              {["Twitter", "LinkedIn", "GitHub"].map((s) => (
                <a key={s} href="#" className="text-xs transition-colors hover:text-white" style={{ color: "#828181" }}>{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
