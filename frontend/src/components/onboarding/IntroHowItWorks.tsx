"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface IntroHowItWorksProps {
  onStart: () => void;
}

const PARAGRAPHS = [
  {
    delay: 0.8,
    text: "Step one: tell us about your business. We'll visit your website and use AI to understand what you sell, who your customers are, and what makes your offer valuable to them.",
  },
  {
    delay: 2.5,
    text: "Step two: we'll build a complete follow-up sequence based on your business type — pre-written email templates with your service, your tone, and your goals already baked in.",
  },
  {
    delay: 4.5,
    text: "Step three: you customize. Edit the messages, adjust the timing between each one, and choose how many follow-ups to send. Everything is pre-filled — you're just refining what's there.",
  },
  {
    delay: 6.5,
    text: "Step four: configure your preferences. Choose how quickly to respond to new leads, how persistent to be with follow-ups, and whether to send appointment reminders after a call is booked.",
  },
  {
    delay: 8.5,
    text: "Step five: connect your lead sources. Whether you're running Facebook Ads, a website contact form, or sending leads via webhook — they all feed directly into your sequence.",
  },
  {
    delay: 10.5,
    text: "Step six: review everything and run a live demo. You'll see exactly what a lead experiences — from the moment they submit to their final follow-up — before going live.",
  },
  {
    delay: 12.5,
    text: "That's it. One setup. Your system is active from that point forward, working around the clock to make sure every lead hears from you — fast.",
  },
];

function fade(delay: number) {
  return {
    initial:    { opacity: 0, y: 15 },
    animate:    { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5, ease: "easeOut" as const },
  };
}

export default function IntroHowItWorks({ onStart }: IntroHowItWorksProps) {
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
          Here&apos;s How It Works
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
      <motion.div {...fade(14.5)} className="mt-16 flex justify-center">
        <button
          type="button"
          onClick={onStart}
          className="h-[52px] w-[240px] rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 hover:-translate-y-px active:translate-y-0"
        >
          Start Setup
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}
