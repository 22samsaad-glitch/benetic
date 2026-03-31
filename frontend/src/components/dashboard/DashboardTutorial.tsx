"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";

const STORAGE_KEY = "jetleads_tutorial_done";

interface Step {
  target: string | null; // data-tutorial value, null = center modal (welcome/done)
  title: string;
  body: string;
  cta: string;
}

const STEPS: Step[] = [
  {
    target: null,
    title: "Welcome to Jetleads 👋",
    body: "You're all set up. This quick tour will show you the key parts of your dashboard so you can start converting leads right away.",
    cta: "Show me around",
  },
  {
    target: "nav-leads",
    title: "Your Leads",
    body: "Every contact captured from your lead sources lands here. You'll see their status, last contact date, and which sequence they're enrolled in.",
    cta: "Next",
  },
  {
    target: "nav-sequences",
    title: "Sequences",
    body: "Sequences are your automated follow-up campaigns. Each sequence runs a series of messages on a schedule — so you never have to manually chase a lead again.",
    cta: "Next",
  },
  {
    target: "nav-pipeline",
    title: "Pipeline",
    body: "Move leads through stages as they get closer to booking. Drag cards across columns and see your deal flow at a glance.",
    cta: "Next",
  },
  {
    target: "nav-templates",
    title: "Templates",
    body: "Pre-written messages tailored to your business. Edit them anytime or create new ones — your sequences pull from these automatically.",
    cta: "Next",
  },
  {
    target: "nav-analytics",
    title: "Analytics",
    body: "Track open rates, reply rates, and booked calls over time. Use this to see which messages and sequences are working best.",
    cta: "Next",
  },
  {
    target: null,
    title: "You're ready to go",
    body: "Head to Leads and add your first contact, or go to Lead Sources to connect an integration and start capturing leads automatically.",
    cta: "Get started",
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function DashboardTutorial() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Decide whether to show on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }, []);

  // Compute spotlight position whenever step changes
  useEffect(() => {
    if (!visible) return;

    const target = STEPS[step].target;
    if (!target) {
      setSpotlight(null);
      setTooltipPos(null);
      return;
    }

    const el = document.querySelector(`[data-tutorial="${target}"]`);
    if (!el) {
      setSpotlight(null);
      setTooltipPos(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 6;
    const sr: SpotlightRect = {
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    };
    setSpotlight(sr);

    // Tooltip: place to the right of the spotlight, vertically centered
    const tooltipTop = sr.top + sr.height / 2;
    const tooltipLeft = sr.left + sr.width + 16;
    setTooltipPos({ top: tooltipTop, left: tooltipLeft });
  }, [step, visible]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (step < STEPS.length - 1) setStep((s) => s + 1);
        else finish();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, step, finish]);

  if (!visible) return null;

  const current = STEPS[step];
  const isCentered = !current.target;
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      <div ref={overlayRef} className="fixed inset-0 z-50" style={{ pointerEvents: "none" }}>
        {/* SVG overlay with spotlight cutout */}
        <motion.svg
          key={`svg-${step}`}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: "all" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={finish}
        >
          <defs>
            <mask id="tutorial-mask">
              <rect width="100%" height="100%" fill="white" />
              {spotlight && (
                <motion.rect
                  key={`cutout-${step}`}
                  x={spotlight.left}
                  y={spotlight.top}
                  width={spotlight.width}
                  height={spotlight.height}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  rx="10"
                  ry="10"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.55)"
            mask="url(#tutorial-mask)"
          />
        </motion.svg>

        {/* Tooltip / card */}
        <AnimatePresence mode="wait">
          {isCentered ? (
            /* Centered modal */
            <motion.div
              key={`centered-${step}`}
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ pointerEvents: "none" }}
            >
              <div
                className="relative bg-white rounded-2xl shadow-2xl p-8 w-[400px] max-w-[90vw]"
                style={{ pointerEvents: "all" }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={finish}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="mb-1 text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  Step {step + 1} of {STEPS.length}
                </div>
                <h2 className="text-[20px] font-bold text-gray-900 mb-2">{current.title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">{current.body}</p>

                {/* Progress dots */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-200 ${
                          i === step ? "w-4 bg-blue-600" : i < step ? "w-1.5 bg-blue-300" : "w-1.5 bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (isLast) finish();
                      else setStep((s) => s + 1);
                    }}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    {current.cta}
                    {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Anchored tooltip */
            tooltipPos && (
              <motion.div
                key={`tooltip-${step}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="absolute bg-white rounded-2xl shadow-2xl p-6 w-[300px]"
                style={{
                  pointerEvents: "all",
                  top: tooltipPos.top - 20,
                  left: tooltipPos.left,
                  transform: "translateY(-50%) translateY(20px)",
                  maxWidth: "calc(100vw - 32px)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Arrow pointing left toward spotlight */}
                <div
                  className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
                  style={{
                    borderTop: "8px solid transparent",
                    borderBottom: "8px solid transparent",
                    borderRight: "8px solid white",
                  }}
                />

                <button
                  onClick={finish}
                  className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="mb-0.5 text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  Step {step + 1} of {STEPS.length}
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">{current.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{current.body}</p>

                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-200 ${
                          i === step ? "w-4 bg-blue-600" : i < step ? "w-1.5 bg-blue-300" : "w-1.5 bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (isLast) finish();
                      else setStep((s) => s + 1);
                    }}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3.5 py-1.5 rounded-lg transition-colors"
                  >
                    {current.cta}
                    {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* Skip link — always visible */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={finish}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/60 hover:text-white/90 transition-colors underline underline-offset-2"
          style={{ pointerEvents: "all" }}
        >
          Skip tour
        </motion.button>
      </div>
    </AnimatePresence>
  );
}
