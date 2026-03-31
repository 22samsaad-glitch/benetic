"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactConfetti from "react-confetti";
import Link from "next/link";
import { leads } from "@/lib/api";

interface StepTestProps {
  onTestSent: () => void;
  testSent: boolean;
}

export default function StepTest({ onTestSent, testSent }: StepTestProps) {
  const [name, setName] = useState("Your Name");
  const [email, setEmail] = useState("you@example.com");
  const [phone, setPhone] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (testSent) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(t);
    }
  }, [testSent]);

  const handleSend = async () => {
    setIsSending(true);
    try {
      const [first_name, ...rest] = name.trim().split(" ");
      await leads.create({
        first_name,
        last_name: rest.join(" ") || undefined,
        email: email || undefined,
        phone: phone || undefined,
        source: "test",
      });
    } catch {
      // fail silently — show success regardless
    } finally {
      setIsSending(false);
      onTestSent();
    }
  };

  if (testSent) {
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

        <div className="text-center space-y-5">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-100"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-2"
          >
            <h2 className="text-2xl font-bold tracking-tight text-foreground">You&apos;re all set!</h2>
            <p className="text-sm text-muted-foreground">
              Check your email — your first follow-up arrives in ~30 seconds.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="space-y-3"
        >
          <Link href="/leads">
            <Button className="w-full h-12 rounded-xl font-semibold text-base">
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/integrations">
            <Button variant="outline" className="w-full h-12 rounded-xl font-medium">
              Connect a Lead Source
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-card">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            className="h-11 rounded-xl bg-background"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-11 rounded-xl bg-background"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            Phone
            <span className="ml-2 text-xs font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="h-11 rounded-xl bg-background"
          />
        </div>
      </div>

      <Button
        onClick={handleSend}
        disabled={isSending || !name.trim() || !email.trim()}
        className="w-full h-12 rounded-xl font-semibold text-base"
      >
        {isSending ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sending...
          </span>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Send Test Lead
          </>
        )}
      </Button>
    </div>
  );
}
