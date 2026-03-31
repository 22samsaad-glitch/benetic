"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, TestTube } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ReactConfetti from "react-confetti";
import Link from "next/link";
import type { WizardData } from "@/types";

interface StepSuccessProps {
  data: WizardData;
  onCreateTestLead: () => void;
  testLeadCreated: boolean;
}

export default function StepSuccess({ data, onCreateTestLead, testLeadCreated }: StepSuccessProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  const enabledMessages = data.sequence.filter((m) => m.enabled);

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
          <h2 className="text-3xl font-bold text-foreground">You&apos;re all set!</h2>
          <p className="text-muted-foreground text-lg">
            {data.companyName
              ? `${data.companyName} is ready to convert leads on autopilot.`
              : "Your automated follow-up is ready to go."}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-xl bg-card border border-border shadow-card p-5 space-y-3"
      >
        <p className="text-sm font-semibold text-foreground">Your follow-up sequence</p>
        <div className="space-y-2">
          {enabledMessages.map((msg, i) => (
            <div key={msg.id} className="flex items-center gap-3 text-sm">
              <span className="shrink-0 w-6 h-6 rounded-full bg-secondary text-primary flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-foreground">{msg.label}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {msg.channel === "email" ? "Email" : "SMS"}
                {msg.delayMinutes > 0 && (
                  <>
                    {" · "}
                    {msg.delayMinutes < 60
                      ? `${msg.delayMinutes}m delay`
                      : msg.delayMinutes < 1440
                      ? `${Math.round(msg.delayMinutes / 60)}h delay`
                      : `${Math.round(msg.delayMinutes / 1440)}d delay`}
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="space-y-3"
      >
        {!testLeadCreated ? (
          <Button
            onClick={onCreateTestLead}
            variant="outline"
            className="w-full h-12 text-base"
          >
            <TestTube className="w-5 h-5 mr-2" />
            Create a test lead
          </Button>
        ) : (
          <div className="text-center text-sm text-emerald-600 font-medium py-3">
            Test lead created! Check your Leads page.
          </div>
        )}

        <Link href="/leads">
          <Button className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90">
            Go to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
