"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, Layers, Mail, Plug } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ReactConfetti from "react-confetti";
import Link from "next/link";

interface StepLaunchProps {
  data: {
    companyName: string;
    industry: string;
    teamSize: string;
    stages: { id: string; name: string; isTerminal: boolean }[];
    templateName: string;
    templateSubject: string;
    templateBody: string;
    connectedIntegrations: string[];
  };
}

export default function StepLaunch({ data }: StepLaunchProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  const nonTerminalStages = data.stages.filter((s) => !s.isTerminal);
  const hasTemplate = !!data.templateName;
  const integrationCount = data.connectedIntegrations.length;

  const summaryItems = [
    {
      icon: <Layers className="w-4 h-4" />,
      label: "Pipeline",
      value: `${nonTerminalStages.length} stages configured`,
    },
    {
      icon: <Mail className="w-4 h-4" />,
      label: "Template",
      value: hasTemplate ? `"${data.templateName}" created` : "Skipped",
    },
    {
      icon: <Plug className="w-4 h-4" />,
      label: "Integrations",
      value: integrationCount > 0 ? `${integrationCount} connected` : "None connected yet",
    },
  ];

  return (
    <div className="space-y-8">
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={250}
          gravity={0.15}
          colors={["#2563EB", "#10b981", "#8b5cf6", "#f59e0b"]}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 100, pointerEvents: "none" }}
        />
      )}

      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-100"
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-1.5"
        >
          <h2 className="text-2xl font-bold tracking-tight text-foreground">You&apos;re all set!</h2>
          <p className="text-sm text-muted-foreground">
            {data.companyName ? `${data.companyName} is ready to go.` : "Your workspace is ready."}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
      >
        {summaryItems.map((item, index) => (
          <div
            key={item.label}
            className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0"
          >
            <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
              <p className="text-sm font-semibold text-foreground">{item.value}</p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <Link href="/leads">
          <Button className="w-full h-12 rounded-xl font-semibold text-base">
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
