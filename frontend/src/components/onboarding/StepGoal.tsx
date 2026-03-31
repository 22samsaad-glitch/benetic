"use client";

import { CalendarCheck, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BusinessGoal } from "@/types";

interface StepGoalProps {
  data: { goal: BusinessGoal | null };
  onUpdate: (updates: { goal: BusinessGoal }) => void;
}

const goals = [
  {
    value: "book_call" as BusinessGoal,
    icon: CalendarCheck,
    title: "Book a consultation",
    description: "Get leads to schedule a meeting with you",
    stages: ["New Lead", "Contacted", "Meeting Booked", "Won", "Lost"],
  },
  {
    value: "convert_direct" as BusinessGoal,
    icon: ShoppingCart,
    title: "Convert directly",
    description: "Get leads to purchase or sign up immediately",
    stages: ["New Lead", "Contacted", "Interested", "Converted", "Lost"],
  },
];

export default function StepGoal({ data, onUpdate }: StepGoalProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const selected = data.goal === goal.value;
          return (
            <button
              key={goal.value}
              type="button"
              onClick={() => onUpdate({ goal: goal.value })}
              className={cn(
                "w-full flex items-start gap-4 p-5 border transition-all duration-150 text-left hover:-translate-y-0.5 active:translate-y-0",
                selected
                  ? "rounded-r-2xl rounded-l-none border-l-4 border-l-blue-600 border-t border-r border-b border-border bg-blue-50"
                  : "rounded-2xl border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/40"
              )}
            >
              <div
                className={cn(
                  "shrink-0 w-11 h-11 rounded-xl flex items-center justify-center",
                  selected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={cn("font-semibold text-sm", selected ? "text-primary" : "text-foreground")}>
                    {goal.title}
                  </p>
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ml-3",
                    selected ? "border-primary bg-primary" : "border-border"
                  )}>
                    {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{goal.description}</p>
                <div className="flex items-center gap-1 mt-3 flex-wrap">
                  {goal.stages.map((stage, i) => (
                    <span key={stage} className="flex items-center gap-1">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        selected
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {stage}
                      </span>
                      {i < goal.stages.length - 1 && (
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
