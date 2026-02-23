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

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);

    // Stop confetti after 5 seconds
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
      icon: <Layers className="w-5 h-5" />,
      label: "Pipeline",
      value: `${nonTerminalStages.length} stages configured`,
      color: "text-violet-600",
      bgColor: "bg-violet-100",
    },
    {
      icon: <Mail className="w-5 h-5" />,
      label: "Template",
      value: hasTemplate ? `"${data.templateName}" created` : "Skipped",
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      icon: <Plug className="w-5 h-5" />,
      label: "Integrations",
      value:
        integrationCount > 0
          ? `${integrationCount} connected`
          : "None connected yet",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
  ];

  return (
    <div className="space-y-8">
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={300}
          gravity={0.15}
          colors={["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"]}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 100, pointerEvents: "none" }}
        />
      )}

      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-2"
        >
          <h2 className="text-3xl font-bold text-gray-900">You&apos;re all set!</h2>
          <p className="text-gray-500 text-lg">
            {data.companyName
              ? `${data.companyName} is ready to go.`
              : "Your workspace is ready to go."}
          </p>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-3"
      >
        {summaryItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + index * 0.15 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-200 shadow-sm"
          >
            <div
              className={`shrink-0 w-10 h-10 rounded-lg ${item.bgColor} ${item.color} flex items-center justify-center`}
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-gray-900">{item.value}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="pt-4"
      >
        <Link href="/leads">
          <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
            Go to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
