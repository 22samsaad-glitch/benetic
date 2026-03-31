"use client";

import { cn } from "@/lib/utils";
import type { Cadence } from "@/types";

interface StepCadenceProps {
  data: { cadence: Cadence | null };
  onUpdate: (updates: { cadence: Cadence }) => void;
}

const cadences = [
  {
    value: "aggressive" as Cadence,
    title: "Aggressive",
    description: "Maximum persistence for high-intent leads",
    recommended: false,
    timeline: ["Now", "+1 day", "+2 days", "+3 days"],
    count: "4 messages",
  },
  {
    value: "normal" as Cadence,
    title: "Normal",
    description: "Proven balance between persistence and respect",
    recommended: true,
    timeline: ["Now", "+2 days", "+5 days"],
    count: "3 messages",
  },
  {
    value: "gentle" as Cadence,
    title: "Gentle",
    description: "Low-pressure follow-ups that don't overwhelm",
    recommended: false,
    timeline: ["Now", "+3 days", "+7 days"],
    count: "3 messages",
  },
];

export default function StepCadence({ data, onUpdate }: StepCadenceProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {cadences.map((cadence) => {
          const selected = data.cadence === cadence.value;
          return (
            <button
              key={cadence.value}
              type="button"
              onClick={() => onUpdate({ cadence: cadence.value })}
              className={cn(
                "w-full flex items-start gap-4 p-5 border transition-all duration-150 text-left bg-card hover:-translate-y-0.5 active:translate-y-0",
                selected
                  ? "rounded-r-2xl rounded-l-none border-l-4 border-l-blue-600 border-t border-r border-b border-border bg-blue-50"
                  : "rounded-2xl border-border hover:border-muted-foreground/40 hover:bg-muted/40"
              )}
            >
              {/* Radio */}
              <div className={cn(
                "shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center",
                selected ? "border-primary bg-primary" : "border-border"
              )}>
                {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className={cn("font-semibold text-sm", selected ? "text-primary" : "text-foreground")}>
                      {cadence.title}
                    </p>
                    {cadence.recommended && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        Recommended
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    selected ? "text-primary" : "text-muted-foreground"
                  )}>
                    {cadence.count}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{cadence.description}</p>

                {/* Timeline pills */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {cadence.timeline.map((item, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-xs px-2.5 py-0.5 rounded-full font-medium",
                        selected
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {item}
                      </span>
                      {i < cadence.timeline.length - 1 && (
                        <span className="text-muted-foreground/40 text-xs">›</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
}
