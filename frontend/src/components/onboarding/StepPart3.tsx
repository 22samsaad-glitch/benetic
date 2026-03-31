"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRight, Check, Mail, MessageSquare } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SequenceMessage } from "@/types";

/* ─── Constants ───────────────────────────────────────────────────────────── */

const TIMING_OPTIONS = [
  { value: 60,    label: "1 hour" },
  { value: 240,   label: "4 hours" },
  { value: 1440,  label: "1 day" },
  { value: 2880,  label: "2 days" },
  { value: 4320,  label: "3 days" },
  { value: 7200,  label: "5 days" },
  { value: 10080, label: "1 week" },
  { value: 20160, label: "2 weeks" },
];

const REMINDER_TIMING_OPTIONS = [
  { value: 60,   label: "1 hour before" },
  { value: 240,  label: "4 hours before" },
  { value: 1440, label: "1 day before" },
  { value: 2880, label: "2 days before" },
];

const MSG_VARIABLES   = ["{{first_name}}", "{{company_name}}", "{{service_name}}", "{{calendar_link}}"];
const APPT_VARIABLES  = ["{{first_name}}", "{{appointment_date}}", "{{appointment_time}}"];

const DEFAULT_DELAYS  = [0, 2880, 4320, 7200, 10080, 14400, 20160];

const DEFAULT_REMINDER_SUBJECT = "Reminder: Our call tomorrow";
const DEFAULT_REMINDER_BODY =
  "Hi {{first_name}},\n\nJust a quick reminder that we have a call scheduled on {{appointment_date}} at {{appointment_time}}.\n\nLooking forward to speaking with you!\n\n[Your Name]";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function timingToLabel(minutes: number): string {
  if (minutes === 0) return "Instantly";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

function delayToDay(cumulativeMinutes: number): string {
  if (cumulativeMinutes === 0) return "Day 1";
  return `Day ${Math.round(cumulativeMinutes / 1440) + 1}`;
}

function makeDefaultMessage(index: number, delayMinutes: number): SequenceMessage {
  const labels   = ["Initial Response", "First Follow-up", "Second Follow-up", "Third Follow-up", "Fourth Follow-up", "Fifth Follow-up", "Sixth Follow-up"];
  const subjects = ["Thanks for reaching out!", "Following up — quick question", "Still interested?", "One more check-in", "Last follow-up", "Quick question", "Closing the loop"];
  const bodies   = [
    "Hi {{first_name}},\n\nThanks for your interest! I'd love to connect and learn more about what you're looking for.\n\nAre you available for a quick call this week?\n\n[Your Name]",
    "Hi {{first_name}},\n\nJust following up on my last message. Still interested?\n\nHappy to answer any questions — just reply here.\n\n[Your Name]",
    "Hi {{first_name}},\n\nI wanted to reach out one more time. Is there anything I can help clarify about {{service_name}}?\n\n[Your Name]",
    "Hi {{first_name}},\n\nI don't want you to miss out. Is this still something you're exploring?\n\n[Your Name]",
    "Hi {{first_name}},\n\nThis is my final follow-up. If the timing isn't right, no worries at all — just let me know.\n\n[Your Name]",
    "Hi {{first_name}},\n\nJust checking in one last time. Reply anytime if things change.\n\n[Your Name]",
    "Hi {{first_name}},\n\nClosing the loop — I'm here whenever you're ready.\n\n[Your Name]",
  ];
  return {
    id: `msg-${index + 1}`,
    label: labels[index] ?? `Message ${index + 1}`,
    channel: "email",
    enabled: true,
    delayMinutes,
    subject: subjects[index] ?? "Following up",
    body: bodies[index] ?? "Hi {{first_name}},\n\nJust following up.\n\n[Your Name]",
  };
}

/* ─── Section header ──────────────────────────────────────────────────────── */

function SectionHeader({
  num, title, isExpanded, isComplete, onClick,
}: {
  num: number; title: string; isExpanded: boolean; isComplete: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#f9fafb] transition-colors"
    >
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
        isComplete ? "bg-emerald-500" : "bg-[#2563eb]",
      )}>
        {isComplete
          ? <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
          : <span className="text-sm font-bold text-white">{num}</span>}
      </div>
      <span className="flex-1 text-[16px] font-semibold text-[#0f172a]">{title}</span>
      <ChevronDown className={cn("h-5 w-5 text-[#9ca3af] transition-transform duration-200", isExpanded && "rotate-180")} />
    </button>
  );
}

/* ─── Accordion wrapper ───────────────────────────────────────────────────── */

function Accordion({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1, transition: { height: { duration: 0.28, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.2, delay: 0.06 } } }}
          exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.22, ease: "easeInOut" }, opacity: { duration: 0.12 } } }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Props ───────────────────────────────────────────────────────────────── */

interface StepPart3Props {
  data: {
    sequence: SequenceMessage[];
    productName: string;
    companyName: string;
    whatYouSell: string;
    calendarLink: string;
    appointmentReminder: { enabled: boolean; minutesBefore: number; subject: string; body: string } | null;
  };
  onUpdate: (updates: {
    sequence?: SequenceMessage[];
    calendarLink?: string;
    appointmentReminder?: { enabled: boolean; minutesBefore: number; subject: string; body: string } | null;
  }) => void;
  onComplete: () => void;
  onBack?: () => void;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function StepPart3({ data, onUpdate, onComplete, onBack }: StepPart3Props) {
  const initNum = Math.min(Math.max(data.sequence.length, 2), 7);

  const [expanded, setExpanded]         = useState<Set<number>>(new Set([1, 2, 3, 4]));
  const [numMessages, setNumMessages]   = useState(initNum);
  const [messages, setMessages]         = useState<SequenceMessage[]>(() => {
    const result: SequenceMessage[] = [];
    for (let i = 0; i < initNum; i++) {
      result.push(data.sequence[i] ?? makeDefaultMessage(i, DEFAULT_DELAYS[i] ?? 4320));
    }
    return result;
  });
  const [openMsgId, setOpenMsgId]       = useState<string | null>(messages[0]?.id ?? null);
  const [previewMsgId, setPreviewMsgId] = useState<string | null>(null);

  // Appointment reminder state
  const existing = data.appointmentReminder;
  const [reminderChoice, setReminderChoice]     = useState<boolean | null>(existing !== null ? existing.enabled : null);
  const [reminderMinutes, setReminderMinutes]   = useState(existing?.minutesBefore ?? 1440);
  const [reminderSubject, setReminderSubject]   = useState(existing?.subject ?? DEFAULT_REMINDER_SUBJECT);
  const [reminderBody, setReminderBody]         = useState(existing?.body ?? DEFAULT_REMINDER_BODY);

  // Textarea refs for cursor-position variable insertion
  const bodyRefs      = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const reminderRef   = useRef<HTMLTextAreaElement | null>(null);
  const sectionRefs   = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);

  /* ── Helpers ── */

  const syncMessages = useCallback((msgs: SequenceMessage[]) => {
    setMessages(msgs);
    onUpdate({ sequence: msgs });
  }, [onUpdate]);

  const syncReminder = useCallback((enabled: boolean, minutes: number, subject: string, body: string) => {
    onUpdate({ appointmentReminder: { enabled, minutesBefore: minutes, subject, body } });
  }, [onUpdate]);

  const updateMessage = (id: string, updates: Partial<SequenceMessage>) => {
    syncMessages(messages.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  /** Insert variable at cursor; falls back to appending. */
  function insertAtCursor(
    ta: HTMLTextAreaElement | null | undefined,
    currentValue: string,
    variable: string,
    onSet: (next: string) => void,
  ) {
    if (ta) {
      const start  = ta.selectionStart ?? currentValue.length;
      const end    = ta.selectionEnd   ?? currentValue.length;
      const next   = currentValue.slice(0, start) + variable + currentValue.slice(end);
      onSet(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + variable.length;
        ta.focus();
      });
    } else {
      onSet(currentValue + " " + variable);
    }
  }

  function insertMsgVariable(id: string, variable: string) {
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;
    insertAtCursor(
      bodyRefs.current.get(id),
      msg.body,
      variable,
      (next) => updateMessage(id, { body: next }),
    );
  }

  function insertReminderVariable(variable: string) {
    insertAtCursor(
      reminderRef.current,
      reminderBody,
      variable,
      (next) => {
        setReminderBody(next);
        if (reminderChoice !== null) syncReminder(reminderChoice, reminderMinutes, reminderSubject, next);
      },
    );
  }

  function handleNumChange(n: number) {
    setNumMessages(n);
    const updated: SequenceMessage[] = [];
    for (let i = 0; i < n; i++) {
      updated.push(messages[i] ?? makeDefaultMessage(i, DEFAULT_DELAYS[i] ?? 4320));
    }
    syncMessages(updated);
    if (!updated.find((m) => m.id === openMsgId)) setOpenMsgId(updated[0]?.id ?? null);
  }

  function toggleSection(n: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(n)) { next.delete(n); }
      else {
        next.add(n);
        setTimeout(() => sectionRefs.current[n - 1]?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 120);
      }
      return next;
    });
  }

  function handleReminderChoice(val: boolean) {
    setReminderChoice(val);
    syncReminder(val, reminderMinutes, reminderSubject, reminderBody);
  }

  /* ── Computed ── */

  const cumulativeMinutes: number[] = [];
  messages.forEach((msg, i) => {
    cumulativeMinutes.push(i === 0 ? 0 : (cumulativeMinutes[i - 1] ?? 0) + msg.delayMinutes);
  });

  const sec3Complete = messages.every((m) => m.body.trim().length > 0 && (m.channel === "sms" || m.subject.trim().length > 0));
  const sec4Complete = reminderChoice !== null;
  const canContinue  = sec3Complete && sec4Complete;

  const completedCount = [true, true, sec3Complete, sec4Complete].filter(Boolean).length;

  /* ── Render ── */

  return (
    <div className="space-y-4">

      {/* Section progress pills */}
      <div className="flex items-center justify-between px-1 pb-1">
        <p className="text-[13px] font-semibold text-[#0f172a]">Configure Messages</p>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((n) => {
              const done =
                n === 1 || n === 2 ||
                (n === 3 && sec3Complete) ||
                (n === 4 && sec4Complete);
              return <div key={n} className={cn("h-1.5 w-5 rounded-full transition-colors duration-300", done ? "bg-[#2563eb]" : "bg-[#e5e7eb]")} />;
            })}
          </div>
          <span className="text-[12px] text-[#9ca3af] font-medium">{completedCount} of 4</span>
        </div>
      </div>

      {/* ── SECTION 1: Number of messages ─────────────────────────────── */}
      <div ref={(el) => { sectionRefs.current[0] = el; }} className="rounded-2xl border border-[#e5e7eb] overflow-hidden bg-white">
        <SectionHeader num={1} title="How many follow-up messages?" isExpanded={expanded.has(1)} isComplete onClick={() => toggleSection(1)} />
        <Accordion open={expanded.has(1)}>
          <div className="border-t border-[#e5e7eb] px-5 py-5">
            <p className="text-[14px] text-[#64748b] mb-4">
              More messages = higher conversion rates. Most businesses use 3–5.
            </p>
            <div
              role="group"
              aria-label="Number of follow-up messages"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowUp")  { e.preventDefault(); handleNumChange(Math.min(numMessages + 1, 7)); }
                if (e.key === "ArrowLeft"  || e.key === "ArrowDown") { e.preventDefault(); handleNumChange(Math.max(numMessages - 1, 2)); }
              }}
              className="flex gap-2 flex-wrap focus:outline-none"
            >
              {[2, 3, 4, 5, 6, 7].map((n) => (
                <motion.button
                  key={n} type="button" onClick={() => handleNumChange(n)}
                  whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(37,99,235,0.15)" }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ duration: 0.12 }}
                  className={cn(
                    "w-16 h-16 rounded-xl border-2 text-xl font-bold transition-colors duration-150",
                    numMessages === n
                      ? "border-[#2563eb] bg-[#2563eb] text-white shadow-md"
                      : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#2563eb]/50 hover:shadow-sm",
                  )}
                >
                  {n}
                </motion.button>
              ))}
            </div>
            {numMessages === 3 && (
              <p className="mt-3 text-[12px] text-[#2563eb] font-medium">← Recommended for most businesses</p>
            )}
          </div>
        </Accordion>
      </div>

      {/* ── SECTION 2: Timing ─────────────────────────────────────────── */}
      <div ref={(el) => { sectionRefs.current[1] = el; }} className="rounded-2xl border border-[#e5e7eb] overflow-hidden bg-white">
        <SectionHeader num={2} title="When should each message send?" isExpanded={expanded.has(2)} isComplete onClick={() => toggleSection(2)} />
        <Accordion open={expanded.has(2)}>
          <div className="border-t border-[#e5e7eb] px-5 py-5 space-y-3">
            <p className="text-[13px] text-[#64748b] mb-1">
              Message 1 always sends instantly. Set the gap for each subsequent message.
            </p>

            {/* Message 1 — locked */}
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-[#374151] w-24 shrink-0">Message 1</span>
              <div className="flex-1 h-11 rounded-xl bg-[#f1f5f9] border border-[#e5e7eb] px-4 flex items-center">
                <span className="text-[13px] text-[#64748b]">Sent instantly</span>
              </div>
              <span className="text-[12px] text-[#9ca3af] w-12 shrink-0 text-right">Day 1</span>
            </div>

            {/* Messages 2+ */}
            <AnimatePresence initial={false}>
              {messages.slice(1).map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.2, delay: i * 0.04, ease: "easeOut" } }}
                  exit={{ opacity: 0, x: -10, transition: { duration: 0.15 } }}
                  className="flex items-center gap-3"
                >
                  <span className="text-[13px] font-semibold text-[#374151] w-24 shrink-0">Message {i + 2}</span>
                  <div className="flex-1">
                    <select
                      value={String(msg.delayMinutes)}
                      onChange={(e) => updateMessage(msg.id, { delayMinutes: Number(e.target.value) })}
                      className="w-full h-11 rounded-xl bg-white px-3 text-[13px] text-[#0f172a] outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all appearance-none cursor-pointer"
                    >
                      {TIMING_OPTIONS.map((opt) => (
                        <option key={opt.value} value={String(opt.value)}>
                          {opt.label} after Message {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-[12px] text-[#9ca3af] w-12 shrink-0 text-right">
                    {delayToDay(cumulativeMinutes[i + 1] ?? 0)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Timeline */}
            <div className="mt-1 pt-4 border-t border-[#e5e7eb]">
              <p className="text-[11px] uppercase tracking-wider text-[#9ca3af] font-semibold mb-3">Timeline preview</p>
              <div className="flex items-center">
                {messages.map((msg, i) => (
                  <React.Fragment key={msg.id}>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-7 h-7 rounded-full bg-[#2563eb] flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">{i + 1}</span>
                      </div>
                      <span className="text-[10px] text-[#9ca3af] whitespace-nowrap">
                        {delayToDay(cumulativeMinutes[i] ?? 0)}
                      </span>
                    </div>
                    {i < messages.length - 1 && <div className="flex-1 h-px bg-[#e5e7eb] mx-2 mb-4" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </Accordion>
      </div>

      {/* ── SECTION 3: Write messages ─────────────────────────────────── */}
      <div ref={(el) => { sectionRefs.current[2] = el; }} className="rounded-2xl border border-[#e5e7eb] overflow-hidden bg-white">
        <SectionHeader num={3} title="Customize your message content" isExpanded={expanded.has(3)} isComplete={sec3Complete} onClick={() => toggleSection(3)} />
        <Accordion open={expanded.has(3)}>
          <div className="border-t border-[#e5e7eb] px-5 py-5 space-y-3">
            <p className="text-[14px] text-[#64748b]">
              Edit these pre-filled templates to match your voice. Click a variable to insert it at your cursor.
            </p>

            <AnimatePresence initial={false}>
              {messages.map((msg, index) => {
                const isOpen      = openMsgId === msg.id;
                const isPreviewing = previewMsgId === msg.id;
                const isEmail     = msg.channel === "email";
                const sendDesc    = index === 0
                  ? "Sent instantly"
                  : `Sent ${timingToLabel(msg.delayMinutes)} after Message ${index}`;
                const bodyFilled  = msg.body.trim().length > 0;
                const subjectFilled = msg.channel === "sms" || msg.subject.trim().length > 0;
                const msgComplete = bodyFilled && subjectFilled;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, delay: index * 0.05, ease: "easeOut" } }}
                    exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.18, ease: "easeIn" } }}
                    layout
                    className={cn(
                      "rounded-xl border overflow-hidden transition-colors duration-200",
                      isOpen ? "border-[#2563eb] ring-1 ring-[#2563eb]/20" : "border-[#e5e7eb]",
                    )}
                  >
                    {/* Card header */}
                    <div
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 cursor-pointer select-none",
                        isOpen ? "bg-blue-50/60 border-b border-[#2563eb]/10" : "hover:bg-[#f9fafb]",
                      )}
                      onClick={() => setOpenMsgId(isOpen ? null : msg.id)}
                    >
                      <div className={cn(
                        "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                        isEmail ? "bg-[#2563eb]/10 text-[#2563eb]" : "bg-emerald-100 text-emerald-700",
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0f172a] truncate">{msg.label}</p>
                        <p className="text-xs text-[#9ca3af]">{sendDesc} · {isEmail ? "Email" : "SMS"}</p>
                      </div>
                      {msgComplete && !isOpen && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                      <ChevronDown className={cn("w-4 h-4 text-[#9ca3af] shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
                    </div>

                    {/* Editor (no AnimatePresence needed — message list uses layout) */}
                    {isOpen && (
                      <div className="px-4 py-4 space-y-4 bg-white">

                        {/* Channel toggle */}
                        <div className="flex items-center gap-3">
                          <Label className="text-xs font-medium text-[#64748b] shrink-0">Channel</Label>
                          <div className="flex rounded-lg border border-[#e5e7eb] overflow-hidden h-8">
                            <button
                              type="button"
                              onClick={() => updateMessage(msg.id, { channel: "email" })}
                              className={cn("flex items-center gap-1.5 px-3 text-xs font-medium transition-colors", isEmail ? "bg-[#2563eb] text-white" : "bg-white text-[#64748b] hover:bg-[#f9fafb]")}
                            >
                              <Mail className="w-3 h-3" /> Email
                            </button>
                            <button
                              type="button"
                              onClick={() => updateMessage(msg.id, { channel: "sms" })}
                              className={cn("flex items-center gap-1.5 px-3 text-xs font-medium transition-colors border-l border-[#e5e7eb]", !isEmail ? "bg-emerald-600 text-white" : "bg-white text-[#64748b] hover:bg-[#f9fafb]")}
                            >
                              <MessageSquare className="w-3 h-3" /> SMS
                            </button>
                          </div>
                        </div>

                        {/* Subject */}
                        {isEmail && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium text-[#64748b]">Subject line</Label>
                              <span className={cn("text-xs", msg.subject.length > 60 ? "text-orange-500 font-medium" : "text-[#9ca3af]")}>
                                {msg.subject.length}/60
                              </span>
                            </div>
                            <input
                              type="text"
                              value={msg.subject}
                              onChange={(e) => updateMessage(msg.id, { subject: e.target.value })}
                              placeholder="Email subject line"
                              className="w-full h-11 rounded-xl bg-white px-3 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
                            />
                          </div>
                        )}

                        {/* Body */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-[#64748b]">
                              {isEmail ? "Email body" : "SMS message"}
                            </Label>
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "text-xs",
                                (isEmail ? msg.body.length > 500 : msg.body.length > 160)
                                  ? "text-orange-500 font-medium"
                                  : "text-[#9ca3af]",
                              )}>
                                {msg.body.length}/{isEmail ? 500 : 160}
                              </span>
                              <button
                                type="button"
                                onClick={() => setPreviewMsgId(isPreviewing ? null : msg.id)}
                                className="text-xs text-[#2563eb] font-medium hover:underline"
                              >
                                {isPreviewing ? "Edit" : "Preview"}
                              </button>
                            </div>
                          </div>

                          {isPreviewing ? (
                            <div className="text-sm p-3 bg-[#f9fafb] rounded-xl border border-[#e5e7eb] whitespace-pre-wrap min-h-[80px] text-[#374151]">
                              {msg.body
                                .replace(/\{\{first_name\}\}/g, "Sarah")
                                .replace(/\{\{company_name\}\}/g, "Acme Corp")
                                .replace(/\{\{service_name\}\}/g, data.productName || "your service")
                                .replace(/\{\{calendar_link\}\}/g, "https://calendly.com/you/30min")}
                            </div>
                          ) : (
                            <>
                              <textarea
                                ref={(el) => { if (el) bodyRefs.current.set(msg.id, el); else bodyRefs.current.delete(msg.id); }}
                                value={msg.body}
                                onChange={(e) => updateMessage(msg.id, { body: e.target.value })}
                                placeholder="Write your message..."
                                rows={isEmail ? 6 : 3}
                                className="w-full resize-none rounded-xl bg-white px-3 py-2.5 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
                              />
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <span className="text-xs text-[#9ca3af]">Insert:</span>
                                {MSG_VARIABLES.map((v) => (
                                  <motion.button
                                    key={v} type="button"
                                    onClick={() => insertMsgVariable(msg.id, v)}
                                    whileTap={{ scale: 1.15 }}
                                    transition={{ duration: 0.1, type: "spring", stiffness: 600 }}
                                    className="text-xs px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#64748b] hover:bg-[#2563eb]/10 hover:text-[#2563eb] transition-colors font-mono"
                                  >
                                    {v}
                                  </motion.button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <p className="flex items-start gap-1.5 text-[13px] text-[#9ca3af] pt-1">
              <span className="text-base leading-none">💡</span>
              <span>Keep messages under 100 words for best response rates.</span>
            </p>
          </div>
        </Accordion>
      </div>

      {/* ── SECTION 4: Appointment reminders ──────────────────────────── */}
      <div ref={(el) => { sectionRefs.current[3] = el; }} className="rounded-2xl border border-[#e5e7eb] overflow-hidden bg-white">
        <SectionHeader num={4} title="Appointment reminders" isExpanded={expanded.has(4)} isComplete={sec4Complete} onClick={() => toggleSection(4)} />
        <Accordion open={expanded.has(4)}>
          <div className="border-t border-[#e5e7eb] px-5 py-5 space-y-4">
            <p className="text-[14px] text-[#64748b]">
              Send an automatic reminder before scheduled calls or appointments?
            </p>

            {/* Yes / No */}
            <div className="space-y-3">
              {[
                { val: true,  label: "Yes, send appointment reminders" },
                { val: false, label: "No, don't send reminders" },
              ].map(({ val, label }) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => handleReminderChoice(val)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-150",
                    reminderChoice === val
                      ? "border-[#2563eb] bg-blue-50"
                      : "border-[#e5e7eb] bg-white hover:border-[#2563eb]/40",
                  )}
                >
                  <div className={cn(
                    "h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center",
                    reminderChoice === val ? "border-[#2563eb]" : "border-[#d1d5db]",
                  )}>
                    {reminderChoice === val && <div className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />}
                  </div>
                  <span className={cn("text-[14px] font-medium", reminderChoice === val ? "text-[#2563eb]" : "text-[#0f172a]")}>
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* Reminder config — only shown when "Yes" */}
            <AnimatePresence initial={false}>
              {reminderChoice === true && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1, transition: { height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.2, delay: 0.06 } } }}
                  exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: "easeInOut" } }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 pt-1 pl-8 border-l-2 border-[#2563eb]/20 ml-2.5">

                    {/* Timing dropdown */}
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-[#374151]">When to send the reminder</Label>
                      <select
                        value={String(reminderMinutes)}
                        onChange={(e) => {
                          const m = Number(e.target.value);
                          setReminderMinutes(m);
                          syncReminder(true, m, reminderSubject, reminderBody);
                        }}
                        className="w-full h-11 rounded-xl bg-white px-3 text-[13px] text-[#0f172a] outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all appearance-none cursor-pointer"
                      >
                        {REMINDER_TIMING_OPTIONS.map((opt) => (
                          <option key={opt.value} value={String(opt.value)}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-[#374151]">Subject</Label>
                      <input
                        type="text"
                        value={reminderSubject}
                        onChange={(e) => {
                          setReminderSubject(e.target.value);
                          syncReminder(true, reminderMinutes, e.target.value, reminderBody);
                        }}
                        placeholder="Reminder: Our call tomorrow"
                        className="w-full h-11 rounded-xl bg-white px-3 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
                      />
                    </div>

                    {/* Body */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[13px] font-semibold text-[#374151]">Reminder message</Label>
                        <span className={cn("text-xs", reminderBody.length > 400 ? "text-orange-500 font-medium" : "text-[#9ca3af]")}>
                          {reminderBody.length}/400
                        </span>
                      </div>
                      <textarea
                        ref={(el) => { reminderRef.current = el; }}
                        value={reminderBody}
                        onChange={(e) => {
                          setReminderBody(e.target.value);
                          syncReminder(true, reminderMinutes, reminderSubject, e.target.value);
                        }}
                        rows={5}
                        className="w-full resize-none rounded-xl bg-white px-3 py-2.5 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-xs text-[#9ca3af]">Insert:</span>
                        {APPT_VARIABLES.map((v) => (
                          <motion.button
                            key={v} type="button"
                            onClick={() => insertReminderVariable(v)}
                            whileTap={{ scale: 1.15 }}
                            transition={{ duration: 0.1, type: "spring", stiffness: 600 }}
                            className="text-xs px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#64748b] hover:bg-[#2563eb]/10 hover:text-[#2563eb] transition-colors font-mono"
                          >
                            {v}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Accordion>
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <div className="pt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="border border-gray-200 rounded-full px-6 py-2.5 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <div className="flex flex-col items-end gap-1">
          {!canContinue && (
            <p className="text-center text-[12px] text-[#9ca3af]">
              {!sec3Complete
                ? "Add content to all messages"
                : "Select a reminder preference"}
            </p>
          )}
          <button
            type="button"
            onClick={canContinue ? onComplete : undefined}
            disabled={!canContinue}
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 transition-all duration-150"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
