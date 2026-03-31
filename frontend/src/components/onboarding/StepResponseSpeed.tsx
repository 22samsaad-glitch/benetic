"use client";

import { Zap, Clock, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Speed = "instant" | "fast" | "same_day";

interface StepResponseSpeedProps {
  data: { responseSpeed: Speed | null };
  onUpdate: (updates: { responseSpeed: Speed }) => void;
}

const speeds = [
  {
    value: "instant" as Speed,
    icon: Zap,
    title: "Lightning fast",
    subtitle: "Under 1 minute",
    description: "Best conversion rates — leads respond before they forget you",
    stat: "78% higher conversion",
    recommended: true,
  },
  {
    value: "fast" as Speed,
    icon: Clock,
    title: "Fast",
    subtitle: "Within 1 hour",
    description: "A slight delay to seem more natural",
    stat: "45% higher conversion",
    recommended: false,
  },
  {
    value: "same_day" as Speed,
    icon: Sun,
    title: "Same day",
    subtitle: "Within business hours",
    description: "Only respond during your working hours",
    stat: "Baseline",
    recommended: false,
  },
];

export default function StepResponseSpeed({ data, onUpdate }: StepResponseSpeedProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {speeds.map((speed) => {
          const Icon = speed.icon;
          const selected = data.responseSpeed === speed.value;
          return (
            <button
              key={speed.value}
              type="button"
              onClick={() => onUpdate({ responseSpeed: speed.value })}
              className={cn(
                "w-full flex items-center gap-4 p-5 border transition-all duration-150 text-left hover:-translate-y-0.5 active:translate-y-0",
                selected
                  ? "rounded-r-2xl rounded-l-none border-l-4 border-l-blue-600 border-t border-r border-b border-border bg-blue-50"
                  : "rounded-2xl border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/40"
              )}
            >
              <div className={cn(
                "shrink-0 w-11 h-11 rounded-xl flex items-center justify-center",
                selected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn("font-semibold text-sm", selected ? "text-primary" : "text-foreground")}>
                    {speed.title}
                  </p>
                  <span className="text-xs text-muted-foreground">{speed.subtitle}</span>
                  {speed.recommended && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{speed.description}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className={cn("text-xs font-semibold", selected ? "text-primary" : "text-muted-foreground")}>
                  {speed.stat}
                </p>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
}

