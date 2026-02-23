"use client";

import { Zap, Clock, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Speed = "instant" | "fast" | "same_day";

interface StepResponseSpeedProps {
  data: {
    responseSpeed: Speed | null;
  };
  onUpdate: (updates: { responseSpeed: Speed }) => void;
}

const speeds = [
  {
    value: "instant" as Speed,
    icon: Zap,
    title: "Lightning fast",
    subtitle: "Under 1 minute",
    description: "Best conversion rates — leads get a response before they forget you",
    stat: "78% higher conversion",
    recommended: true,
  },
  {
    value: "fast" as Speed,
    icon: Clock,
    title: "Fast",
    subtitle: "Within 1 hour",
    description: "Great for when you want a slight delay to seem more natural",
    stat: "45% higher conversion",
    recommended: false,
  },
  {
    value: "same_day" as Speed,
    icon: Sun,
    title: "Same day",
    subtitle: "Within business hours",
    description: "Only respond during your working hours",
    stat: "Baseline conversion",
    recommended: false,
  },
];

export default function StepResponseSpeed({ data, onUpdate }: StepResponseSpeedProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">How fast should we respond?</h2>
        <p className="text-gray-500">
          Speed is everything. The faster you follow up, the more leads you convert.
        </p>
      </div>

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
                "w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left relative",
                selected
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              {speed.recommended && (
                <span className="absolute -top-2.5 right-4 text-xs font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              )}
              <div
                className={cn(
                  "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                  selected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "font-semibold",
                      selected ? "text-blue-700" : "text-gray-900"
                    )}
                  >
                    {speed.title}
                  </p>
                  <span className="text-xs text-gray-400">{speed.subtitle}</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{speed.description}</p>
                <p
                  className={cn(
                    "text-xs font-medium mt-1.5",
                    selected ? "text-blue-600" : "text-gray-400"
                  )}
                >
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
