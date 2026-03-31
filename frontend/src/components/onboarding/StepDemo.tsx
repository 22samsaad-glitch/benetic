"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SequenceMessage } from "@/types";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function replaceVars(text: string, productName: string): string {
  return text
    .replace(/\{\{first_name\}\}/g, "Sarah")
    .replace(/\{\{company_name\}\}/g, "Acme Corp")
    .replace(/\{\{service_name\}\}/g, productName || "your service")
    .replace(/\{\{your_business_name\}\}/g, "Your Business");
}

function delayToDaysLabel(minutes: number): string {
  if (minutes === 0) return "instantly";
  if (minutes < 60) return `${minutes} minutes later`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hours later`;
  const d = Math.round(minutes / 1440);
  return `${d} day${d !== 1 ? "s" : ""} later`;
}

function delayToDayNum(minutes: number): number {
  return Math.round(minutes / 1440) + 1;
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function EmailCard({
  subject,
  body,
  channel,
}: {
  subject: string;
  body: string;
  channel: "email" | "sms";
}) {
  if (channel === "sms") {
    return (
      <div className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden shadow-sm">
        <div className="flex items-center gap-2.5 px-4 py-3 bg-[#f0fdf4] border-b border-[#e5e7eb]">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span className="text-[13px] font-semibold text-emerald-700">SMS Message</span>
        </div>
        <div className="px-4 py-3 space-y-2">
          <div className="flex gap-2 text-[12px]">
            <span className="text-[#9ca3af] w-12 shrink-0">To:</span>
            <span className="text-[#374151]">(555) 123-4567</span>
          </div>
          <div className="mt-3 text-[13px] text-[#374151] whitespace-pre-wrap leading-relaxed bg-emerald-50 rounded-xl px-3 py-2.5 border border-emerald-100">
            {body}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-[#f8f9ff] border-b border-[#e5e7eb]">
        <Mail className="w-4 h-4 text-[#2563eb]" />
        <span className="text-[13px] font-semibold text-[#2563eb]">Email Preview</span>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex gap-2 text-[12px]">
          <span className="text-[#9ca3af] w-12 shrink-0">To:</span>
          <span className="text-[#374151]">sarah.demo@example.com</span>
        </div>
        <div className="flex gap-2 text-[12px]">
          <span className="text-[#9ca3af] w-12 shrink-0">From:</span>
          <span className="text-[#374151]">you@yourcompany.com</span>
        </div>
        {subject && (
          <div className="flex gap-2 text-[12px]">
            <span className="text-[#9ca3af] w-12 shrink-0">Subject:</span>
            <span className="text-[#0f172a] font-medium">{subject}</span>
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-[#f1f5f9] text-[13px] text-[#374151] whitespace-pre-wrap leading-relaxed">
          {body}
        </div>
      </div>
    </div>
  );
}

function Timeline({
  messages,
  currentIndex,
}: {
  messages: SequenceMessage[];
  currentIndex: number;
}) {
  const enabled = messages.filter((m) => m.enabled);
  const cumulative: number[] = [];
  enabled.forEach((m, i) => {
    cumulative.push(i === 0 ? 0 : (cumulative[i - 1] ?? 0) + m.delayMinutes);
  });

  return (
    <div className="flex items-center py-2">
      {enabled.map((msg, i) => {
        const isPast    = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <React.Fragment key={msg.id}>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300",
                  isCurrent
                    ? "border-[#2563eb] bg-[#2563eb] ring-4 ring-[#2563eb]/20"
                    : isPast
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-[#d1d5db] bg-white"
                )}
              >
                {isPast ? (
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <span className="text-[11px] font-bold text-white">{i + 1}</span>
                )}
              </motion.div>
              <span className="text-[10px] text-[#9ca3af] whitespace-nowrap font-medium">
                {i === 0 ? "Day 1" : `Day ${delayToDayNum(cumulative[i] ?? 0)}`}
              </span>
            </div>
            {i < enabled.length - 1 && (
              <div className="relative flex-1 h-0.5 mx-1.5 mb-4 overflow-hidden rounded-full bg-[#e5e7eb]">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
                  animate={{ width: i < currentIndex ? "100%" : "0%" }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Screen wrappers ─────────────────────────────────────────────────────── */

const screenVariants = {
  enter:  { opacity: 0, y: 16, scale: 0.99 },
  center: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:   { opacity: 0, y: -12, scale: 0.99, transition: { duration: 0.2, ease: "easeIn" } },
};

function ContinueButton({ onClick, label = "Continue", loading = false }: { onClick: () => void; label?: string; loading?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full h-12 rounded-full bg-gray-900 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all duration-150"
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface StepDemoProps {
  sequence: SequenceMessage[];
  productName: string;
  onComplete: () => void;
  isSubmitting: boolean;
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function StepDemo({ sequence, productName, onComplete, isSubmitting }: StepDemoProps) {
  const [screen, setScreen]     = useState(0);
  const [progDone, setProgDone] = useState(false);

  const enabled = sequence.filter((m) => m.enabled);
  const msg1    = enabled[0];
  const msg2    = enabled[1];

  // Auto-advance screen 1 after progress bar
  useEffect(() => {
    if (screen !== 1) return;
    setProgDone(false);
    const fill = setTimeout(() => setProgDone(true), 2000);
    const next = setTimeout(() => setScreen(2), 2600);
    return () => { clearTimeout(fill); clearTimeout(next); };
  }, [screen]);

  const advance = () => setScreen((s) => s + 1);

  return (
    <div className="space-y-0">
      {/* Skip link — always visible except intro and final */}
      {screen > 0 && screen < 5 && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={onComplete}
            className="text-xs text-[#9ca3af] hover:text-[#64748b] transition-colors"
          >
            Skip demo — go to dashboard
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── SCREEN 0: Intro ── */}
        {screen === 0 && (
          <motion.div
            key="intro"
            variants={screenVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="text-center space-y-6 py-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-5xl"
            >
              🎬
            </motion.div>
            <div>
              <h2 className="text-[26px] font-bold text-[#0f172a] mb-2">
                Let&apos;s See It In Action!
              </h2>
              <p className="text-[15px] text-[#64748b] leading-relaxed max-w-sm mx-auto">
                We&apos;ll simulate a lead coming in so you can see your follow-up sequence work — using the exact messages you created.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-[13px] text-[#9ca3af]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9ca3af]" />
              <span>Takes about 30 seconds</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#9ca3af]" />
            </div>
            <div className="space-y-3 max-w-xs mx-auto">
              <button
                type="button"
                onClick={advance}
                className="w-full h-12 rounded-full bg-gray-900 hover:bg-gray-700 text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all duration-150"
              >
                Start Demo <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onComplete}
                className="w-full text-[13px] text-[#9ca3af] hover:text-[#64748b] transition-colors py-1"
              >
                Skip Demo — Go to Dashboard
              </button>
            </div>
          </motion.div>
        )}

        {/* ── SCREEN 1: New Lead Arrives ── */}
        {screen === 1 && (
          <motion.div
            key="lead"
            variants={screenVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-5"
          >
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="text-2xl"
              >
                📩
              </motion.div>
              <h3 className="text-[20px] font-bold text-[#0f172a]">New Lead Received!</h3>
            </div>

            {/* Lead card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-[#e5e7eb] bg-white p-4 space-y-2 shadow-sm"
            >
              {[
                { label: "Name",     value: "Sarah Johnson" },
                { label: "Email",    value: "sarah.demo@example.com" },
                { label: "Phone",    value: "(555) 123-4567" },
                { label: "Source",   value: "Website Form" },
                { label: "Received", value: "Just now" },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3 text-[13px]">
                  <span className="text-[#9ca3af] w-16 shrink-0">{label}:</span>
                  <span className="text-[#374151] font-medium">{value}</span>
                </div>
              ))}
            </motion.div>

            {/* Sending indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="space-y-2.5"
            >
              <div className="flex items-center gap-2 text-[14px] font-medium text-[#374151]">
                <motion.div
                  animate={{ rotate: progDone ? 0 : 360 }}
                  transition={{ duration: 1, repeat: progDone ? 0 : Infinity, ease: "linear" }}
                >
                  {progDone ? (
                    <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-[#2563eb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.2" />
                      <path d="M21 12a9 9 0 00-9-9" />
                    </svg>
                  )}
                </motion.div>
                <span>{progDone ? "Message 1 queued!" : "Message 1 sending..."}</span>
              </div>

              <div className="h-2 rounded-full bg-[#e5e7eb] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[#2563eb]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <button
                type="button"
                onClick={() => setScreen(2)}
                className="w-full h-10 rounded-xl border border-[#e5e7eb] text-[13px] text-[#64748b] hover:bg-[#f9fafb] transition-colors"
              >
                Skip animation →
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ── SCREEN 2: Message 1 Sent ── */}
        {screen === 2 && msg1 && (
          <motion.div
            key="msg1"
            variants={screenVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-5"
          >
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
              </motion.div>
              <h3 className="text-[20px] font-bold text-[#0f172a]">Message 1 Sent!</h3>
            </div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <EmailCard
                channel={msg1.channel}
                subject={replaceVars(msg1.subject, productName)}
                body={replaceVars(msg1.body, productName)}
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-[13px] text-[#64748b] text-center"
            >
              Sarah received your message instantly ✓
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <ContinueButton onClick={advance} />
            </motion.div>
          </motion.div>
        )}

        {/* ── SCREEN 3: Time Passes + Message 2 ── */}
        {screen === 3 && (
          <motion.div
            key="msg2"
            variants={screenVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-5"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏰</span>
              <h3 className="text-[20px] font-bold text-[#0f172a]">
                {msg2 ? delayToDaysLabel(msg2.delayMinutes).replace(/^\w/, (c) => c.toUpperCase()) + "..." : "Time Passes..."}
              </h3>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-[#e5e7eb] bg-white p-4"
            >
              <p className="text-[13px] text-[#64748b] mb-3">Sarah hasn&apos;t responded yet.</p>
              <p className="text-[11px] uppercase tracking-wider text-[#9ca3af] font-semibold mb-3">Sequence timeline</p>
              <Timeline messages={sequence} currentIndex={1} />
            </motion.div>

            {msg2 && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 text-[13px] text-emerald-700 font-medium"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <path d="M22 4L12 14.01l-3-3" />
                  </svg>
                  Message 2 sent automatically
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <EmailCard
                    channel={msg2.channel}
                    subject={replaceVars(msg2.subject, productName)}
                    body={replaceVars(msg2.body, productName)}
                  />
                </motion.div>
              </>
            )}

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <ContinueButton onClick={advance} />
            </motion.div>
          </motion.div>
        )}

        {/* ── SCREEN 4: Sarah Responds ── */}
        {screen === 4 && (
          <motion.div
            key="response"
            variants={screenVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-5"
          >
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.05 }}
                className="text-2xl"
              >
                💬
              </motion.div>
              <h3 className="text-[20px] font-bold text-[#0f172a]">Sarah Responded!</h3>
            </div>

            {/* Response card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden shadow-sm"
            >
              <div className="px-4 py-3 bg-[#f9fafb] border-b border-[#e5e7eb] space-y-1">
                <div className="flex gap-2 text-[12px]">
                  <span className="text-[#9ca3af] w-12 shrink-0">From:</span>
                  <span className="text-[#374151]">sarah.demo@example.com</span>
                </div>
                <div className="flex gap-2 text-[12px]">
                  <span className="text-[#9ca3af] w-12 shrink-0">Received:</span>
                  <span className="text-[#374151]">3 hours ago</span>
                </div>
              </div>
              <div className="px-4 py-4 text-[14px] text-[#374151] leading-relaxed italic">
                &ldquo;Thanks for following up! I&apos;d like to schedule a consultation. When are you available?&rdquo;
              </div>
            </motion.div>

            {/* Success message */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 22 }}
              className="rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-4 space-y-1.5"
            >
              <p className="text-[15px] font-bold text-emerald-800">🎉 Your follow-up worked!</p>
              <p className="text-[13px] text-emerald-700 leading-relaxed">
                Sarah is now a qualified lead in your pipeline, ready for you to respond. This is exactly how it works when real leads come in.
              </p>
            </motion.div>

            {/* Success banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 22 }}
              className="rounded-2xl bg-blue-50 border border-blue-100 px-5 py-4 space-y-2"
            >
              <p className="text-[13px] font-semibold text-[#1d4ed8]">This is exactly how it works when real leads come in:</p>
              <ul className="space-y-1.5">
                {[
                  "Lead arrives → Message 1 sends instantly",
                  "No response → follow-ups send on schedule",
                  "You track everything in your dashboard",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[12px] text-[#374151]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2563eb] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <ContinueButton onClick={onComplete} label="Go to Dashboard" loading={isSubmitting} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
