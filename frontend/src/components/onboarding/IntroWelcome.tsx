"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface IntroWelcomeProps {
  onContinue: () => void;
}

const PARAGRAPHS = [
  {
    delay: 0.8,
    text: "Welcome. You're about to set up a system that follows up with every single lead — automatically, personally, and within minutes of them reaching out.",
  },
  {
    delay: 2.5,
    text: "Most businesses lose 78% of their leads simply because they respond too slowly. A call back the next morning means that lead already hired someone else.",
  },
  {
    delay: 4.5,
    text: "Jetleads changes that. The moment a lead fills out your form, clicks your ad, or submits an inquiry — your follow-up sequence begins. Even at 2am on a Sunday.",
  },
  {
    delay: 6.5,
    text: "We'll analyze your business, understand exactly what you sell and who you serve, then generate a personalized follow-up sequence in seconds — pre-written and ready to go.",
  },
  {
    delay: 8.5,
    text: "You'll review the messages, customize them to sound exactly like you, set your timing preferences, and connect your lead sources. The whole setup takes about 5 minutes.",
  },
  {
    delay: 10.5,
    text: "After that, the system runs itself. Leads come in, messages go out, you focus on closing deals. Let's get started.",
  },
];

function fade(delay: number) {
  return {
    initial:    { opacity: 0, y: 15 },
    animate:    { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5, ease: "easeOut" as const },
  };
}

export default function IntroWelcome({ onContinue }: IntroWelcomeProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-[640px] mx-auto px-6 py-12 md:px-12"
    >
      {/* Heading */}
      <motion.div {...fade(0)} className="mb-14 text-center">
        <h1 className="text-[32px] font-bold text-[#0f172a] tracking-tight md:text-[36px]">
          Welcome to Jetleads
        </h1>
        <div className="mx-auto mt-4 h-px w-20 bg-[#e5e7eb]" />
      </motion.div>

      {/* Paragraphs */}
      <div className="space-y-7">
        {PARAGRAPHS.map(({ delay, text }) => (
          <motion.p
            key={delay}
            {...fade(delay)}
            className="text-[17px] leading-[1.8] text-[#64748b] md:text-[18px]"
          >
            {text}
          </motion.p>
        ))}
      </div>

      {/* Button */}
      <motion.div {...fade(12.5)} className="mt-16 flex justify-center">
        <button
          type="button"
          onClick={onContinue}
          className="h-[52px] w-[240px] rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 hover:-translate-y-px active:translate-y-0"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}
