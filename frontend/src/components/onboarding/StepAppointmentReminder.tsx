"use client";

import { motion } from "framer-motion";
import { Bell, BellOff } from "lucide-react";

const REMINDER_OPTIONS = [
  { value: 60,   label: "1 hour before" },
  { value: 240,  label: "4 hours before" },
  { value: 1440, label: "1 day before" },
  { value: 2880, label: "2 days before" },
];

interface AppointmentReminder {
  enabled: boolean;
  minutesBefore: number;
}

interface Props {
  data: { appointmentReminder: AppointmentReminder | null };
  onUpdate: (updates: { appointmentReminder: AppointmentReminder | null }) => void;
}

export default function StepAppointmentReminder({ data, onUpdate }: Props) {
  const current = data.appointmentReminder;
  const isYes = current?.enabled === true;
  const isNo  = current?.enabled === false;

  function selectYes() {
    onUpdate({ appointmentReminder: { enabled: true, minutesBefore: current?.minutesBefore ?? 1440 } });
  }

  function selectNo() {
    onUpdate({ appointmentReminder: { enabled: false, minutesBefore: 0 } });
  }

  function setTiming(minutesBefore: number) {
    onUpdate({ appointmentReminder: { enabled: true, minutesBefore } });
  }

  return (
    <div className="space-y-4">
      {/* Yes option */}
      <motion.button
        type="button"
        onClick={selectYes}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.1 }}
        className={`w-full rounded-2xl border-2 p-5 text-left transition-all duration-150 ${
          isYes
            ? "border-[#2563eb] bg-[#2563eb]/[0.03] ring-1 ring-[#2563eb]/20"
            : "border-[#e5e7eb] bg-white hover:border-[#2563eb]/40 hover:shadow-sm"
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${isYes ? "bg-[#2563eb]" : "bg-[#f1f5f9]"}`}>
            <Bell className={`h-5 w-5 ${isYes ? "text-white" : "text-[#64748b]"}`} />
          </div>
          <div className="flex-1">
            <p className={`text-[15px] font-semibold mb-1 ${isYes ? "text-[#2563eb]" : "text-[#0f172a]"}`}>
              Yes, send a reminder
            </p>
            <p className="text-[13px] text-[#64748b] leading-snug">
              Automatically email the lead before their appointment to reduce no-shows.
            </p>
          </div>
          <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${isYes ? "border-[#2563eb]" : "border-[#d1d5db]"}`}>
            {isYes && <div className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />}
          </div>
        </div>

        {/* Timing selector — only when Yes is selected */}
        {isYes && (
          <div className="mt-4 ml-14" onClick={(e) => e.stopPropagation()}>
            <p className="mb-2 text-[13px] font-medium text-[#374151]">Send reminder:</p>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setTiming(opt.value); }}
                  className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-all ${
                    current?.minutesBefore === opt.value
                      ? "border-[#2563eb] bg-[#2563eb] text-white"
                      : "border-[#e2e8f0] text-[#64748b] hover:border-[#2563eb]/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.button>

      {/* No option */}
      <motion.button
        type="button"
        onClick={selectNo}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.1 }}
        className={`w-full rounded-2xl border-2 p-5 text-left transition-all duration-150 ${
          isNo
            ? "border-[#64748b] bg-[#f8fafc] ring-1 ring-[#64748b]/20"
            : "border-[#e5e7eb] bg-white hover:border-[#94a3b8] hover:shadow-sm"
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${isNo ? "bg-[#64748b]" : "bg-[#f1f5f9]"}`}>
            <BellOff className={`h-5 w-5 ${isNo ? "text-white" : "text-[#94a3b8]"}`} />
          </div>
          <div className="flex-1">
            <p className={`text-[15px] font-semibold mb-1 ${isNo ? "text-[#374151]" : "text-[#0f172a]"}`}>
              No reminder needed
            </p>
            <p className="text-[13px] text-[#64748b] leading-snug">
              I&apos;ll handle appointment confirmations manually or through another tool.
            </p>
          </div>
          <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${isNo ? "border-[#64748b]" : "border-[#d1d5db]"}`}>
            {isNo && <div className="h-2.5 w-2.5 rounded-full bg-[#64748b]" />}
          </div>
        </div>
      </motion.button>

      {/* Skip hint */}
      {!current && (
        <p className="text-center text-xs text-[#9ca3af] pt-1">
          You can change this anytime from Settings → Automations.
        </p>
      )}
    </div>
  );
}
