"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { auth, leads } from "@/lib/api";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type Phase = "setup" | "sending" | "success" | "error";

interface StepRealTestProps {
  onComplete: () => void;
}

/* ─── Sending steps ───────────────────────────────────────────────────────── */

const SEND_STEPS = [
  "Creating lead in your system...",
  "Scheduling follow-up sequence...",
  "Sending first message...",
];

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function StepRealTest({ onComplete }: StepRealTestProps) {
  const [phase,       setPhase]       = useState<Phase>("setup");
  const [activeStep,  setActiveStep]  = useState(-1);
  const [userEmail,   setUserEmail]   = useState("");
  const [formName,    setFormName]    = useState("Demo Test Lead");
  const [formPhone,   setFormPhone]   = useState("(555) 000-0000");
  const [emailTarget, setEmailTarget] = useState<"account" | "custom">("account");
  const [customEmail, setCustomEmail] = useState("");
  const [sentEmail,   setSentEmail]   = useState("");
  const [wfTriggered, setWfTriggered] = useState(false);
  const [errorMsg,    setErrorMsg]    = useState("");

  useEffect(() => {
    auth.me()
      .then((u) => setUserEmail(u.email))
      .catch(() => {});
  }, []);

  const targetEmail = emailTarget === "account" ? userEmail : customEmail;
  const canSubmit   = !!formName.trim() && !!targetEmail.trim();

  const handleSend = async () => {
    setPhase("sending");
    setActiveStep(0);

    // Animate steps in
    const t1 = setTimeout(() => setActiveStep(1), 850);
    const t2 = setTimeout(() => setActiveStep(2), 1700);

    try {
      const [result] = await Promise.all([
        leads.createTest({
          name:  formName.trim()  || "Demo Test Lead",
          email: targetEmail.trim(),
          phone: formPhone.trim() || "(555) 000-0000",
        }),
        new Promise<void>((res) => setTimeout(res, 2600)),
      ]);

      setSentEmail(result.email);
      setWfTriggered(result.workflow_triggered);
      setPhase("success");
    } catch {
      setPhase("error");
      setErrorMsg("Couldn't create the test lead. Please try again.");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
    }
  };

  const handleRetry = () => {
    setPhase("setup");
    setActiveStep(-1);
    setErrorMsg("");
  };

  return (
    <AnimatePresence mode="wait">
      {/* ── SETUP ── */}
      {phase === "setup" && (
        <motion.div
          key="setup"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
          className="space-y-5"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧪</span>
            <div>
              <h3 className="text-[20px] font-bold text-[#0f172a]">Test With a Real Lead</h3>
              <p className="text-[13px] text-[#64748b]">We&apos;ll create a real test lead and send you an actual email.</p>
            </div>
          </div>

          {/* What happens */}
          <div className="rounded-2xl bg-[#f9fafb] border border-[#e5e7eb] px-4 py-3.5 space-y-2">
            <p className="text-[12px] font-semibold text-[#374151] uppercase tracking-wider">What happens:</p>
            {[
              "A demo lead is created in your system",
              "Your first message is sent to your email",
              "The lead appears in your dashboard",
              "Follow-ups are scheduled automatically",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-[13px] text-[#374151]">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#2563eb] shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <div className="h-px bg-[#e5e7eb]" />

          {/* Test lead fields */}
          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-[#0f172a]">Test Lead Details</p>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#64748b]">Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Demo Test Lead"
                className="h-10 text-sm rounded-xl border-[#e5e7eb]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#64748b]">Phone</Label>
              <Input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="(555) 000-0000"
                className="h-10 text-sm rounded-xl border-[#e5e7eb]"
              />
            </div>
          </div>

          <div className="h-px bg-[#e5e7eb]" />

          {/* Email destination */}
          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-[#0f172a]">Where should we send the test email?</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                  emailTarget === "account" ? "border-[#2563eb] bg-[#2563eb]" : "border-[#d1d5db] bg-white"
                )}
                onClick={() => setEmailTarget("account")}
              >
                {emailTarget === "account" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className="text-[13px] text-[#374151]">
                My account email
                {userEmail && <span className="text-[#9ca3af] ml-1">({userEmail})</span>}
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <div
                className={cn(
                  "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                  emailTarget === "custom" ? "border-[#2563eb] bg-[#2563eb]" : "border-[#d1d5db] bg-white"
                )}
                onClick={() => setEmailTarget("custom")}
              >
                {emailTarget === "custom" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="flex-1 space-y-2">
                <span className="text-[13px] text-[#374151]">Different email:</span>
                {emailTarget === "custom" && (
                  <Input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus
                    className="h-10 text-sm rounded-xl border-[#e5e7eb]"
                  />
                )}
              </div>
            </label>
          </div>

          <div className="h-px bg-[#e5e7eb]" />

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSubmit}
              className="w-full h-12 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-[#93c5fd] disabled:cursor-not-allowed text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 hover:-translate-y-px active:translate-y-0"
            >
              Send Test Lead <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onComplete}
              className="w-full text-[13px] text-[#9ca3af] hover:text-[#64748b] transition-colors py-1"
            >
              Skip — Go to Dashboard
            </button>
          </div>
        </motion.div>
      )}

      {/* ── SENDING ── */}
      {phase === "sending" && (
        <motion.div
          key="sending"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
          className="space-y-8 py-4"
        >
          <div className="text-center space-y-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-full border-4 border-[#2563eb]/20 border-t-[#2563eb] mx-auto"
            />
            <h3 className="text-[20px] font-bold text-[#0f172a]">Creating Your Test Lead...</h3>
          </div>

          <div className="space-y-4 max-w-xs mx-auto">
            {SEND_STEPS.map((label, i) => {
              const done    = i < activeStep;
              const active  = i === activeStep;
              const pending = i > activeStep;
              return (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: pending ? 0.35 : 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    done   ? "bg-emerald-500" : active ? "bg-[#2563eb]" : "bg-[#e5e7eb]"
                  )}>
                    {done ? (
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : active ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-white"
                      />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-[#9ca3af]" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[14px] transition-colors",
                    done ? "text-emerald-700 font-medium" : active ? "text-[#0f172a] font-medium" : "text-[#9ca3af]"
                  )}>
                    {done ? label.replace("...", "") + " ✓" : label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── SUCCESS ── */}
      {phase === "success" && (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
          className="space-y-5 py-2"
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </motion.div>
            <h3 className="text-[20px] font-bold text-[#0f172a]">Test Lead Created!</h3>
          </div>

          <p className="text-[14px] text-[#64748b]">Your test is on its way!</p>

          {/* Checklist */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 space-y-3">
            {[
              { label: "Lead created in your system", done: true },
              { label: `First message sent to: ${sentEmail}`, done: wfTriggered },
              { label: "Follow-ups scheduled", done: wfTriggered },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-start gap-2.5 text-[13px]">
                {done ? (
                  <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
                  </svg>
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <span className={done ? "text-[#374151]" : "text-[#92400e]"}>{label}</span>
              </div>
            ))}
          </div>

          {wfTriggered ? (
            <p className="text-[13px] text-[#64748b] leading-relaxed">
              Check your inbox — you should receive the email within 1 minute. The test lead will appear in your dashboard as &ldquo;{formName}&rdquo;.
            </p>
          ) : (
            <p className="text-[13px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 leading-relaxed">
              Email service isn&apos;t configured yet. The lead was created and will appear in your dashboard. Configure email in Settings to enable sending.
            </p>
          )}

          <button
            type="button"
            onClick={onComplete}
            className="w-full h-12 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 hover:-translate-y-px active:translate-y-0"
          >
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* ── ERROR ── */}
      {phase === "error" && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
          className="space-y-5 py-2"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-7 h-7 text-red-500" />
            <h3 className="text-[20px] font-bold text-[#0f172a]">Something went wrong</h3>
          </div>

          <p className="text-[14px] text-[#64748b]">{errorMsg}</p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleRetry}
              className="w-full h-12 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all duration-150"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={onComplete}
              className="w-full text-[13px] text-[#9ca3af] hover:text-[#64748b] transition-colors py-1"
            >
              Skip — Go to Dashboard
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
