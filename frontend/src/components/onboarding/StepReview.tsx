"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Edit2, CheckCircle2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardData } from "@/types";

/* ─── Labels ─────────────────────────────────────────────────────────────── */

const SPEED_LABELS: Record<string, string> = {
  instant:  "Instant (within 5 min)",
  fast:     "Fast (within 1 hour)",
  same_day: "Same Day",
};

const CADENCE_LABELS: Record<string, string> = {
  aggressive: "Aggressive — 4 messages",
  normal:     "Normal — 3 messages",
  gentle:     "Gentle — 3 messages (spaced out)",
};

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e5e7eb]">
        <h3 className="text-[15px] font-semibold text-[#0f172a]">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
        >
          <Edit2 className="w-3 h-3" />
          Edit
        </button>
      </div>
      <div className="px-5 py-4 space-y-3">{children}</div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <span className="text-[13px] text-[#64748b] shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-[#0f172a] text-right">{value || "—"}</span>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function timingLabel(minutes: number, index: number): string {
  if (index === 0) return "Instantly";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface StepReviewProps {
  data: WizardData;
  onEdit: (step: number) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function StepReview({ data, onEdit, onConfirm, isSubmitting }: StepReviewProps) {
  const [expandedMsgId, setExpandedMsgId] = useState<string | null>(null);
  const enabledMessages = data.sequence.filter((m) => m.enabled);

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="text-center pb-2"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 border border-blue-100 mb-3">
          <CheckCircle2 className="w-7 h-7 text-[#2563eb]" />
        </div>
        <h2 className="text-[22px] font-bold text-[#0f172a] mb-1">Review your setup</h2>
        <p className="text-[14px] text-[#64748b]">
          Everything look good? Click Edit on any section to make changes.
        </p>
      </motion.div>

      {/* Section 1: Business */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.08 }}
      >
        <ReviewSection title="Your Business" onEdit={() => onEdit(0)}>
          <DataRow label="Company" value={data.companyName || null} />
          <DataRow
            label="Business type"
            value={data.businessType === "products" ? "Products" : data.businessType === "services" ? "Services" : null}
          />
          <DataRow label="What you sell" value={data.productName || data.whatYouSell || null} />
        </ReviewSection>
      </motion.div>

      {/* Section 2: Follow-up Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.13 }}
      >
        <ReviewSection title="Follow-up Settings" onEdit={() => onEdit(1)}>
          <DataRow
            label="Response speed"
            value={data.responseSpeed ? SPEED_LABELS[data.responseSpeed] : null}
          />
          <DataRow
            label="Cadence"
            value={data.cadence ? CADENCE_LABELS[data.cadence] : null}
          />
          <DataRow label="Total messages" value={String(enabledMessages.length)} />
        </ReviewSection>
      </motion.div>

      {/* Section 3: Message Sequence */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.18 }}
      >
        <ReviewSection title="Message Sequence" onEdit={() => onEdit(4)}>
          {enabledMessages.length === 0 ? (
            <p className="text-[13px] text-[#9ca3af]">No messages configured</p>
          ) : (
            <div className="space-y-2">
              {enabledMessages.map((msg, i) => {
                const isExpanded = expandedMsgId === msg.id;
                return (
                  <div key={msg.id} className="rounded-xl border border-[#e5e7eb] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedMsgId(isExpanded ? null : msg.id)}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[#f9fafb] transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#2563eb]/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[#2563eb]">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#0f172a] truncate">{msg.label}</p>
                        <p className="text-[11px] text-[#9ca3af]">
                          {timingLabel(msg.delayMinutes, i)} · {msg.channel === "email" ? "Email" : "SMS"}
                        </p>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 text-[#9ca3af] transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>
                    {isExpanded && (
                      <div className="border-t border-[#e5e7eb] px-3.5 py-3 bg-[#f9fafb]">
                        {msg.channel === "email" && msg.subject && (
                          <p className="text-[12px] text-[#64748b] font-medium mb-1.5">
                            Subject: {msg.subject}
                          </p>
                        )}
                        <p className="text-[12px] text-[#374151] whitespace-pre-wrap leading-relaxed line-clamp-5">
                          {msg.body}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ReviewSection>
      </motion.div>

      {/* Section 4: Lead Source */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.23 }}
      >
        <ReviewSection title="Lead Source" onEdit={() => onEdit(4)}>
          {data.leadSource ? (
            <DataRow
              label="Connected"
              value={
                data.leadSource === "meta"   ? "Facebook Lead Ads" :
                data.leadSource === "webhook" ? "Webhook / API" :
                "Manual"
              }
            />
          ) : (
            <p className="text-[13px] text-[#9ca3af]">
              Not connected — you can set this up from the Integrations page anytime.
            </p>
          )}
        </ReviewSection>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.3 }}
        className="pt-2 pb-4"
      >
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="h-12 rounded-full bg-gray-900 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold flex items-center justify-center gap-2 px-8 transition-all duration-150"
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Setting up your system...
            </>
          ) : (
            <>
              Looks Good! See It In Action
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
