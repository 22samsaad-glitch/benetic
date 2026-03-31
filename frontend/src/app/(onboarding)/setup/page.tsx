"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pipelines, templates, workflows } from "@/lib/api";
import type { WizardData, BusinessType, BusinessGoal, Cadence, SequenceMessage } from "@/types";
import ReactConfetti from "react-confetti";

import StepBusinessAnalysis    from "@/components/onboarding/StepBusinessAnalysis";
import StepQualificationRules  from "@/components/onboarding/StepQualificationRules";
import StepLeadSources          from "@/components/onboarding/StepLeadSources";
import StepPart3                from "@/components/onboarding/StepPart3";
import StepReview               from "@/components/onboarding/StepReview";
import StepDemo                 from "@/components/onboarding/StepDemo";

/* ─── Constants ──────────────────────────────────────────────────────────── */

const CADENCE_DELAYS: Record<Cadence, number[]> = {
  aggressive: [0, 1440, 2880, 4320],
  normal:     [0, 2880, 7200],
  gentle:     [0, 4320, 10080],
};

/* ─── Part structure ─────────────────────────────────────────────────────── */

const PARTS = [
  { label: "Know Your Business",   steps: [0] },
  { label: "Configure Messages",   steps: [1] },
  { label: "Connect Lead Sources", steps: [2] },
];

function getPart(step: number): number {
  if (step === 0) return 1;
  if (step === 1) return 2;
  if (step === 2) return 3;
  return 4; // Review/Demo (not shown in part indicator)
}

function getStepWithinPart(step: number): number {
  if (step === 0) return 1;
  if (step === 1) return 1;
  if (step === 2) return 1;
  if (step === 3) return 1;
  return 2;
}

/* ─── Data utilities ─────────────────────────────────────────────────────── */

function buildSequenceForSettings(
  businessType: BusinessType | null,
  goal: BusinessGoal | null,
  cadence: Cadence | null,
  productName?: string
): SequenceMessage[] {
  const delays     = CADENCE_DELAYS[cadence ?? "normal"];
  const isProduct  = businessType === "products";
  const isBookCall = goal === "book_call";
  const thing = productName?.trim()
    ? `{{service_name}}`
    : isProduct ? "[your product]" : "[your service]";
  const cta = isBookCall
    ? "Are you available for a quick 15-minute call this week?"
    : "Reply to this email or click below to get started.";

  const msgs: SequenceMessage[] = [
    {
      id: "msg-1", label: "Initial outreach", channel: "email", enabled: true,
      delayMinutes: delays[0], subject: "Thanks for reaching out!",
      body: `Hi {{first_name}},\n\nThanks for your interest in ${thing}! I'd love to connect.\n\n${cta}\n\n[Your Name]`,
    },
    {
      id: "msg-2", label: "Follow-up", channel: "email", enabled: true,
      delayMinutes: delays[1], subject: "Following up - quick question",
      body: `Hi {{first_name}},\n\nJust following up on my last message. Still interested in ${thing}?\n\nLet me know — happy to answer any questions.\n\n[Your Name]`,
    },
    {
      id: "msg-3", label: "Last follow-up", channel: "email", enabled: true,
      delayMinutes: delays[2], subject: "Last chance to connect",
      body: `Hi {{first_name}},\n\nI don't want you to miss out! This is my final follow-up about ${thing}.\n\nIf you're still interested, just reply and I'll make time for you.\n\n[Your Name]`,
    },
  ];

  if (delays.length >= 4) {
    msgs.push({
      id: "msg-4", label: "Final outreach", channel: "email", enabled: true,
      delayMinutes: delays[3], subject: "One last thing",
      body: `Hi {{first_name}},\n\nClosing the loop — I'm here whenever ${thing} makes sense for you.\n\nNo pressure, just wanted you to know the door is always open.\n\n[Your Name]`,
    });
  }

  return msgs;
}

function getStagesForGoal(goal: BusinessGoal) {
  return goal === "book_call"
    ? [
        { name: "New",         isTerminal: false },
        { name: "Contacted",   isTerminal: false },
        { name: "Call Booked", isTerminal: false },
        { name: "Converted",   isTerminal: true  },
        { name: "Lost",        isTerminal: true  },
      ]
    : [
        { name: "New",         isTerminal: false },
        { name: "Contacted",   isTerminal: false },
        { name: "Interested",  isTerminal: false },
        { name: "Deal Closed", isTerminal: true  },
        { name: "Lost",        isTerminal: true  },
      ];
}

/* ─── Initial data ───────────────────────────────────────────────────────── */

const INITIAL_DATA: WizardData = {
  businessType: null, productName: "", productDescription: "",
  websiteUrl: "", companyName: "", industry: "", whatYouSell: "",
  targetAudience: null,
  goal: "book_call",
  responseSpeed: null, cadence: null,
  sequence: buildSequenceForSettings(null, "book_call", null),
  leadSource: null,
  appointmentReminder: null,
  calendarLink: "",
  audienceType: null,
  selectedAudiences: [],
  leadSources: [],
  qualificationRules: [],
};

/* ─── Animation variants ─────────────────────────────────────────────────── */

const stepVariants = {
  enter:  (dir: number) => ({ opacity: 0, y: dir >= 0 ? 24 : -24, scale: 0.99 }),
  center: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:   (dir: number) => ({ opacity: 0, y: dir >= 0 ? -16 : 16, scale: 0.99, transition: { duration: 0.22, ease: "easeIn" } }),
};

/* ─── Step progress indicator ────────────────────────────────────────────── */

function StepProgress({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const done    = i < currentStep;
        const active  = i === currentStep;
        const stepNum = i + 1;
        return (
          <React.Fragment key={i}>
            <div
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold border-2 transition-all duration-300",
                done   ? "text-white"
                       : active ? "bg-white text-[#0454ff]"
                       : "bg-white border-gray-200 text-gray-400"
              )}
              style={done ? { background: "#0454ff", borderColor: "#0454ff" } : active ? { borderColor: "#0454ff" } : {}}
            >
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : stepNum}
            </div>
            {i < totalSteps - 1 && (
              <div className="h-0.5 w-10 bg-gray-200 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500"
                  style={{ width: done ? "100%" : "0%", background: "#0454ff" }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function SetupPage() {
  const router = useRouter();
  const [currentStep,     setCurrentStep]     = useState(0);
  const [direction,       setDirection]       = useState(0);
  const [data,            setData]            = useState<WizardData>(INITIAL_DATA);
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [setupCompleted,  setSetupCompleted]  = useState(false);
  const [returnToReview,  setReturnToReview]  = useState(false);
  const [contextExpanded, setContextExpanded] = useState(true);
  const [showScrollHint,  setShowScrollHint]  = useState(false);
  const [windowSize,      setWindowSize]      = useState({ width: 0, height: 0 });
  const [showConfetti,    setShowConfetti]    = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const onResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  React.useEffect(() => {
    if (setupCompleted) {
      setShowConfetti(true);
      const confettiTimer = setTimeout(() => setShowConfetti(false), 5000);
      const redirectTimer = setTimeout(() => router.push("/leads"), 3500);
      return () => { clearTimeout(confettiTimer); clearTimeout(redirectTimer); };
    }
  }, [setupCompleted, router]);

  /* ── Data ── */
  const updateData = useCallback((updates: Partial<WizardData>) => {
    setData((prev) => {
      const next = { ...prev, ...updates };
      const affectsSeq =
        updates.businessType !== undefined || updates.goal        !== undefined ||
        updates.cadence      !== undefined || updates.productName !== undefined;
      if (affectsSeq) {
        const dflt = buildSequenceForSettings(prev.businessType, prev.goal, prev.cadence, prev.productName);
        if (JSON.stringify(prev.sequence) === JSON.stringify(dflt)) {
          next.sequence = buildSequenceForSettings(next.businessType, next.goal, next.cadence, next.productName);
        }
      }
      return next;
    });
  }, []);

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: return false; // StepBusinessAnalysis manages its own navigation
      case 1: return false; // StepQualificationRules manages its own navigation
      case 2: return data.sequence.filter((m) => m.enabled).every((m) => m.body.trim());
      case 3: return data.leadSources.length > 0;
      default: return true;
    }
  };

  /* ── Submission ── */
  const submitWizard = async () => {
    setIsSubmitting(true);
    try {
      const pipeline = await pipelines.create({ name: "Default Pipeline" });
      const stages   = getStagesForGoal(data.goal!);
      for (let i = 0; i < stages.length; i++) {
        await pipelines.addStage(pipeline.id, {
          name: stages[i].name, position: i, is_terminal: stages[i].isTerminal,
        });
      }
      const enabled = data.sequence.filter((m) => m.enabled);
      const tplIds: string[] = [];
      for (const msg of enabled) {
        const t = await templates.create({
          name: msg.label, channel: msg.channel,
          subject: msg.channel === "email" ? msg.subject : undefined,
          body: msg.body,
        });
        tplIds.push(t.id);
      }
      const wfSteps: { position: number; step_type: string; config: Record<string, unknown> }[] = [];
      let pos = 0;
      for (let i = 0; i < enabled.length; i++) {
        const msg = enabled[i];
        if (msg.delayMinutes > 0)
          wfSteps.push({ position: pos++, step_type: "delay", config: { minutes: msg.delayMinutes } });
        wfSteps.push({
          position: pos++,
          step_type: msg.channel === "email" ? "send_email" : "send_sms",
          config: { template_id: tplIds[i] },
        });
      }
      await workflows.create({
        name: "Lead Follow-up Sequence",
        trigger_type: "on_lead_created",
        trigger_config: {},
        steps: wfSteps,
      });
    } catch (err) {
      console.error("Setup failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Navigation ── */
  const goNext = async () => {
    if (!isStepValid(currentStep) || isSubmitting) return;

    // If editing from review, skip straight back to step 4
    if (returnToReview) {
      setReturnToReview(false);
      setDirection(1);
      setCurrentStep(4);
      setContextExpanded(true);
      return;
    }

    setDirection(1);
    setCurrentStep((p) => p + 1);
    setContextExpanded(true);
  };

  const goBack = () => {
    if (currentStep === 0) return;
    setDirection(-1);
    setCurrentStep((p) => p - 1);
    setContextExpanded(true);
  };

  const handleQualificationRulesComplete = useCallback((rules: string[]) => {
    updateData({ qualificationRules: rules });
    setDirection(1);
    setCurrentStep(2);
    setContextExpanded(true);
  }, [updateData]);

  const handleGoToSources = () => {
    setReturnToReview(false);
    setDirection(1);
    setCurrentStep(3);
    setContextExpanded(true);
  };

  const handleGoToReview = () => {
    setReturnToReview(false);
    setDirection(1);
    setCurrentStep(4);
  };

  const handleGoToDemo = () => {
    setDirection(1);
    setCurrentStep(5);
  };

  const handleFinalSubmit = async () => {
    await submitWizard();
    setSetupCompleted(true);
  };

  const handleBusinessAnalysisComplete = useCallback((result: {
    business_description: string;
    primary_audience: string;
    message_style: string;
    what_you_sell: string;
    business_type: string;
    url_accessible: boolean;
    company_name: string;
    website_url: string;
    audienceType: "everyone" | "specific";
    selectedAudiences: string[];
  }) => {
    const btype = result.business_type === "products" ? "products" : "services";
    updateData({
      companyName:        result.company_name,
      websiteUrl:         result.website_url,
      productName:        result.what_you_sell,
      productDescription: result.business_description,
      businessType:       btype,
      audienceType:       result.audienceType,
      selectedAudiences:  result.selectedAudiences,
    });
    setDirection(1);
    setCurrentStep(1);
    setContextExpanded(true);
  }, [updateData]);

  const handleEditFromReview = (step: number) => {
    setReturnToReview(true);
    setDirection(-1);
    setCurrentStep(step);
    setContextExpanded(true);
  };

  const isFinalStep = setupCompleted;

  React.useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [currentStep]);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const check = () => {
      const hasMore = el.scrollHeight - el.scrollTop > el.clientHeight + 32;
      setShowScrollHint(hasMore);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    return () => el.removeEventListener("scroll", check);
  }, [currentStep, contextExpanded]);

  // Keyboard shortcut: Enter advances step 3 (lead sources)
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && isStepValid(currentStep) && !isSubmitting && currentStep === 3) {
        goNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isSubmitting]);

  /* ── Render ── */

  // Success screen
  if (setupCompleted) {
    return (
      <div className="flex h-screen items-center justify-center px-6" style={{ background: "#f5f6f8" }}>
        {showConfetti && (
          <ReactConfetti
            width={windowSize.width} height={windowSize.height}
            recycle={false} numberOfPieces={300} gravity={0.15}
            colors={["#126dfb", "#10b981", "#8b5cf6", "#f59e0b"]}
            style={{ position: "fixed", top: 0, left: 0, zIndex: 100, pointerEvents: "none" }}
          />
        )}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center space-y-8 max-w-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-100 mx-auto"
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
            <h2 className="text-2xl font-bold tracking-tight text-[#0f172a]">You&apos;re all set!</h2>
            <p className="text-[15px] text-[#64748b] mt-2 leading-relaxed">
              Your automated follow-up system is ready. Every new lead will now be contacted automatically.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="space-y-3"
          >
            <Link href="/leads">
              <Button className="w-full h-12 rounded-xl font-semibold text-base">
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/integrations">
              <Button variant="outline" className="w-full h-12 rounded-xl font-medium">
                Manage Integrations
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen flex-col font-sans" style={{ background: "#fff" }}>

        {/* ── TOP BAR ──────────────────────────────────── */}
        <header className="shrink-0 flex h-16 items-center justify-between px-8" style={{ background: "#fff", borderBottom: "1px solid #eaeaea" }}>
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z" fill="#2563eb" />
            </svg>
            <span className="text-base font-bold" style={{ color: "#000000" }}>Jetleads</span>
          </Link>
          {/* Center nav links */}
          <nav className="hidden md:flex items-center gap-8">
            {["Home", "Features", "Pricing", "FAQ"].map((l) => (
              <Link key={l} href={l === "Home" ? "/" : `/#${l.toLowerCase()}`}
                className="text-sm font-medium transition-opacity hover:opacity-60" style={{ color: "#3d3d3d" }}>
                {l}
              </Link>
            ))}
          </nav>
          {/* Get started button */}
          <Link href="/register"
            className="inline-flex items-center gap-1.5 text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#000000", borderRadius: 100, padding: "8px 18px" }}>
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </header>

        {/* ── CONTENT AREA ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto" ref={scrollContainerRef} style={{ background: "#f5f6f8" }}>
          <div className="min-h-full flex flex-col items-center justify-start py-10 px-6">
            <div className="w-full max-w-2xl">

              {/* Step progress — only for steps 0-5 */}
              {currentStep <= 5 && (
                <StepProgress currentStep={currentStep} totalSteps={6} />
              )}

              {/* Card wrapper — Flowsuite style */}
              <div className="rounded-2xl p-10" style={{ background: "#f5f6f8" }}>

                {/* Animated step block */}
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={String(currentStep) + String(setupCompleted)}
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    {/* ── STEP 0 HEADING ── */}
                    {currentStep === 0 && (
                      <>
                        <motion.h2
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.28, ease: "easeOut" }}
                          className="text-[26px] font-bold leading-snug tracking-tight text-[#0f172a] md:text-[28px]"
                        >
                          Tell us about your business
                        </motion.h2>
                        <p className="mt-2 mb-6 text-[15px] text-[#64748b]">
                          We&apos;ll analyze your business and pre-build your follow-up system.
                        </p>
                        <div className="mb-6 h-px bg-[#e5e7eb]" />
                      </>
                    )}

                    {/* ── STEP 1: Qualification Rules heading ── */}
                    {currentStep === 1 && (
                      <>
                        <motion.h2
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.28, ease: "easeOut" }}
                          className="text-[26px] font-bold leading-snug tracking-tight text-[#0f172a] md:text-[28px]"
                        >
                          Who should you follow up with?
                        </motion.h2>
                        <p className="mt-2 mb-6 text-[15px] text-[#64748b]">
                          We&apos;ll automatically flag leads that don&apos;t match these criteria so you only spend time on the right ones.
                        </p>
                        <div className="mb-6 h-px bg-[#e5e7eb]" />
                      </>
                    )}

                    {/* ── STEP 2: Configure Messages heading ── */}
                    {currentStep === 2 && (
                      <>
                        <motion.h2
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.28, ease: "easeOut" }}
                          className="text-[26px] font-bold leading-snug tracking-tight text-[#0f172a] md:text-[28px]"
                        >
                          Customize your follow-up messages
                        </motion.h2>
                        <p className="mt-2 mb-6 text-[15px] text-[#64748b]">
                          These templates fire automatically for every new lead — write them once and the system handles the rest.
                        </p>
                        <div className="mb-6 h-px bg-[#e5e7eb]" />
                      </>
                    )}

                    {/* ── STEP 3: Connect Lead Sources heading ── */}
                    {currentStep === 3 && (
                      <>
                        <motion.h2
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.28, ease: "easeOut" }}
                          className="text-[26px] font-bold leading-snug tracking-tight text-[#0f172a] md:text-[28px]"
                        >
                          Connect your lead sources
                        </motion.h2>
                        <p className="mt-2 mb-6 text-[15px] text-[#64748b]">
                          Connect where your leads come from so they flow in automatically.
                        </p>
                        <div className="mb-6 h-px bg-[#e5e7eb]" />
                      </>
                    )}

                    {/* ── STEP CONTENT ── */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.14 }}
                    >
                      {currentStep === 0 && (
                        <StepBusinessAnalysis onComplete={handleBusinessAnalysisComplete} />
                      )}
                      {currentStep === 1 && (
                        <StepQualificationRules
                          websiteUrl={data.websiteUrl}
                          companyName={data.companyName}
                          onComplete={handleQualificationRulesComplete}
                          onBack={goBack}
                        />
                      )}
                      {currentStep === 2 && (
                        <StepPart3
                          data={{
                            sequence:            data.sequence,
                            productName:         data.productName,
                            companyName:         data.companyName,
                            whatYouSell:         data.whatYouSell,
                            calendarLink:        data.calendarLink,
                            appointmentReminder: data.appointmentReminder,
                          }}
                          onUpdate={updateData}
                          onComplete={handleGoToSources}
                          onBack={goBack}
                        />
                      )}
                      {currentStep === 3 && (
                        <StepLeadSources
                          data={{ leadSources: data.leadSources, companyName: data.companyName, websiteUrl: data.websiteUrl }}
                          onUpdate={updateData}
                          onComplete={handleGoToDemo}
                          isSubmitting={isSubmitting}
                          onBack={goBack}
                        />
                      )}
                      {currentStep === 4 && (
                        <StepReview
                          data={data}
                          onEdit={handleEditFromReview}
                          onConfirm={handleGoToDemo}
                          isSubmitting={false}
                        />
                      )}
                      {currentStep === 5 && (
                        <StepDemo
                          sequence={data.sequence}
                          productName={data.productName}
                          onComplete={handleFinalSubmit}
                          isSubmitting={isSubmitting}
                        />
                      )}
                    </motion.div>

                  </motion.div>
                </AnimatePresence>

              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <AnimatePresence>
            {showScrollHint && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="sticky bottom-0 left-0 right-0 flex justify-center pb-3 pointer-events-none"
              >
                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-[#e5e7eb] rounded-full px-4 py-1.5 shadow-sm">
                  <motion.div
                    animate={{ y: [0, 3, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <svg className="h-3.5 w-3.5 text-[#94a3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  </motion.div>
                  <span className="text-xs text-[#94a3b8] font-medium">Scroll to continue</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


      </div>
    </>
  );
}
