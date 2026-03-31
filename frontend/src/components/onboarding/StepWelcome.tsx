"use client";

import { Zap, Clock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function StepWelcome() {
  const features = [
    {
      icon: Zap,
      title: "Instant follow-up",
      description: "Respond to new leads in seconds, not hours",
    },
    {
      icon: Clock,
      title: "Automated sequences",
      description: "Email and SMS messages sent on autopilot",
    },
    {
      icon: TrendingUp,
      title: "More conversions",
      description: "Turn leads into customers while you sleep",
    },
  ];

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary text-primary mb-2"
        >
          <Zap className="w-8 h-8" />
        </motion.div>
        <h2 className="text-3xl font-bold text-foreground">
          Follow up faster, close more deals
        </h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Set up your automated lead follow-up in under 5 minutes.
          No technical skills needed.
        </p>
      </div>

      <div className="grid gap-4 text-left max-w-md mx-auto">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border shadow-card"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-muted text-primary flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{feature.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{feature.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
