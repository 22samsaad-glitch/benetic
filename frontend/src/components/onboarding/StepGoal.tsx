"use client";

import { CalendarCheck, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BusinessGoal } from "@/types";

interface StepGoalProps {
  data: {
    goal: BusinessGoal | null;
  };
  onUpdate: (updates: { goal: BusinessGoal }) => void;
}

const goals = [
  {
    value: "book_call" as BusinessGoal,
    icon: CalendarCheck,
    title: "Book a consultation / call",
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
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">What&apos;s your goal?</h2>
        <p className="text-gray-500">
          This determines your pipeline stages and dashboard layout.
        </p>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const selected = data.goal === goal.value;
          return (
            <button
              key={goal.value}
              type="button"
              onClick={() => onUpdate({ goal: goal.value })}
              className={cn(
                "w-full flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-200 text-left",
                selected
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <div
                className={cn(
                  "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                  selected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-semibold",
                    selected ? "text-blue-700" : "text-gray-900"
                  )}
                >
                  {goal.title}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{goal.description}</p>
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {goal.stages.map((stage, i) => (
                    <span key={stage} className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          selected
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {stage}
                      </span>
                      {i < goal.stages.length - 1 && (
                        <span className="text-gray-300 text-xs">&rarr;</span>
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
