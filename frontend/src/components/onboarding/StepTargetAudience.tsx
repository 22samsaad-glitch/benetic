"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TargetAudience } from "@/types";

interface StepTargetAudienceProps {
  data: { targetAudience: TargetAudience | null };
  onUpdate: (updates: { targetAudience: TargetAudience }) => void;
}

const OPTIONS = [
  {
    id: "homeowners" as TargetAudience,
    emoji: "🏠",
    label: "Homeowners",
    description: "Residential customers",
  },
  {
    id: "small_business" as TargetAudience,
    emoji: "🏢",
    label: "Small Businesses",
    description: "1–50 employees",
  },
  {
    id: "enterprise" as TargetAudience,
    emoji: "🏛️",
    label: "Enterprise / Corps",
    description: "50+ employees",
  },
  {
    id: "consumers" as TargetAudience,
    emoji: "👥",
    label: "General Consumers",
    description: "B2C customers",
  },
];

export default function StepTargetAudience({ data, onUpdate }: StepTargetAudienceProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {OPTIONS.map((opt, i) => {
        const selected = data.targetAudience === opt.id;
        return (
          <motion.button
            key={opt.id}
            type="button"
            onClick={() => onUpdate({ targetAudience: opt.id })}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.22, delay: i * 0.06, ease: "easeOut" } }}
            whileHover={{ y: -2, boxShadow: selected ? "0 6px 20px rgba(37,99,235,0.18)" : "0 4px 14px rgba(0,0,0,0.08)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "relative flex flex-col items-center justify-center gap-3 px-4 py-6 rounded-2xl border-2 text-center transition-colors duration-200 min-h-[140px]",
              selected
                ? "border-[#2563eb] bg-blue-50/60"
                : "border-[#e5e7eb] bg-white hover:border-[#2563eb]/40"
            )}
          >
            {/* Selected indicator */}
            {selected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#2563eb] flex items-center justify-center"
              >
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </motion.div>
            )}

            <span className="text-[40px] leading-none select-none">{opt.emoji}</span>

            <div>
              <p className={cn("text-[16px] font-semibold leading-tight", selected ? "text-[#1d4ed8]" : "text-[#0f172a]")}>
                {opt.label}
              </p>
              <p className="text-[13px] text-[#9ca3af] mt-1">{opt.description}</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
