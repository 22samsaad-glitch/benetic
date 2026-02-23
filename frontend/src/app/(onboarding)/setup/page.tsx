"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pipelines, templates, workflows, leads } from "@/lib/api";
import type { WizardData, SequenceMessage, BusinessGoal } from "@/types";

import StepWelcome from "@/components/onboarding/StepWelcome";
import StepBusinessInfo from "@/components/onboarding/StepBusinessInfo";
import StepGoal from "@/components/onboarding/StepGoal";
import StepResponseSpeed from "@/components/onboarding/StepResponseSpeed";
import StepMessages from "@/components/onboarding/StepMessages";
import StepLeadSource from "@/components/onboarding/StepLeadSource";
import StepSuccess from "@/components/onboarding/StepSuccess";

const TOTAL_STEPS = 5; // Steps 0-5 (Welcome=0, Business=1, Goal=2, Speed=3, Messages=4, Source=5), then 6=success

function buildDefaultSequence(companyName: string, whatYouSell: string): SequenceMessage[] {
  const product = whatYouSell || "our services";
  const company = companyName || "our team";
  return [
    {
      id: "msg-1",
      label: "Welcome Email",
      channel: "email",
      enabled: true,
      delayMinutes: 0,
      subject: `Thanks for your interest in ${product}`,
      body: `Hi {{first_name}},\n\nThanks for reaching out! I'm excited to learn more about what you're looking for.\n\nAt ${company}, we help people just like you with ${product}.\n\nI'll follow up shortly with more details. In the meantime, feel free to reply to this email with any questions.\n\nBest,\n${company}`,
    },
    {
      id: "msg-2",
      label: "Check-in SMS",
      channel: "sms",
      enabled: true,
      delayMinutes: 120,
      subject: "",
      body: `Hi {{first_name}}! This is ${company}. Just wanted to make sure you got our email about ${product}. Any questions? Reply here or call us anytime.`,
    },
    {
      id: "msg-3",
      label: "Follow-up Email",
      channel: "email",
      enabled: true,
      delayMinutes: 1440,
      subject: `Quick follow-up — ${product}`,
      body: `Hi {{first_name}},\n\nI wanted to follow up on my previous email. Many of our clients had the same questions when they first reached out.\n\nHere's what makes ${product} different:\n- Fast response times\n- Personalized approach\n- Proven results\n\nWould you be open to a quick chat this week? Just reply with a time that works.\n\nBest,\n${company}`,
    },
  ];
}

function getStagesForGoal(goal: BusinessGoal) {
  if (goal === "book_call") {
    return [
      { name: "New", isTerminal: false },
      { name: "Contacted", isTerminal: false },
      { name: "Meeting Booked", isTerminal: false },
      { name: "Won", isTerminal: true },
      { name: "Lost", isTerminal: true },
    ];
  }
  return [
    { name: "New", isTerminal: false },
    { name: "Contacted", isTerminal: false },
    { name: "Interested", isTerminal: false },
    { name: "Converted", isTerminal: true },
    { name: "Lost", isTerminal: true },
  ];
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

const INITIAL_DATA: WizardData = {
  companyName: "",
  industry: "",
  whatYouSell: "",
  goal: null,
  responseSpeed: null,
  sequence: buildDefaultSequence("", ""),
  leadSource: null,
};

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testLeadCreated, setTestLeadCreated] = useState(false);

  const updateData = useCallback(
    (updates: Partial<WizardData>) => {
      setData((prev) => {
        const next = { ...prev, ...updates };
        // Rebuild default messages when company/product changes and messages haven't been manually edited
        if (
          (updates.companyName !== undefined || updates.whatYouSell !== undefined) &&
          JSON.stringify(prev.sequence) === JSON.stringify(buildDefaultSequence(prev.companyName, prev.whatYouSell))
        ) {
          next.sequence = buildDefaultSequence(next.companyName, next.whatYouSell);
        }
        return next;
      });
    },
    []
  );

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: return true; // Welcome
      case 1: return !!(data.companyName.trim() && data.industry);
      case 2: return !!data.goal;
      case 3: return !!data.responseSpeed;
      case 4: return data.sequence.filter((m) => m.enabled).every((m) => m.body.trim());
      case 5: return true; // Lead source is optional
      default: return true;
    }
  };

  const submitWizard = async () => {
    try {
      setIsSubmitting(true);

      // 1. Create pipeline with goal-based stages
      const pipeline = await pipelines.create({ name: "Default Pipeline" });
      const stages = getStagesForGoal(data.goal!);
      for (let i = 0; i < stages.length; i++) {
        await pipelines.addStage(pipeline.id, {
          name: stages[i].name,
          position: i,
          is_terminal: stages[i].isTerminal,
        });
      }

      // 2. Create templates for each enabled message
      const enabledMessages = data.sequence.filter((m) => m.enabled);
      const templateIds: string[] = [];
      for (const msg of enabledMessages) {
        const tmpl = await templates.create({
          name: msg.label,
          channel: msg.channel,
          subject: msg.channel === "email" ? msg.subject : undefined,
          body: msg.body,
        });
        templateIds.push(tmpl.id);
      }

      // 3. Create workflow with delay + send steps
      const workflowSteps: { position: number; step_type: string; config: Record<string, unknown> }[] = [];
      let pos = 0;
      for (let i = 0; i < enabledMessages.length; i++) {
        const msg = enabledMessages[i];
        if (msg.delayMinutes > 0) {
          workflowSteps.push({
            position: pos++,
            step_type: "delay",
            config: { minutes: msg.delayMinutes },
          });
        }
        workflowSteps.push({
          position: pos++,
          step_type: msg.channel === "email" ? "send_email" : "send_sms",
          config: { template_id: templateIds[i] },
        });
      }

      await workflows.create({
        name: "Lead Follow-up Sequence",
        trigger_type: "on_lead_created",
        trigger_config: {},
        steps: workflowSteps,
      });
    } catch (error) {
      console.error("Failed to save setup:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goNext = async () => {
    if (!isStepValid(currentStep)) return;

    // On transitioning from step 5 (lead source) to success, submit everything
    if (currentStep === 5) {
      await submitWizard();
    }

    setDirection(1);
    setCurrentStep((prev) => prev + 1);
  };

  const goBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleCreateTestLead = async () => {
    try {
      await leads.create({
        first_name: "Test",
        last_name: "Lead",
        email: "test@example.com",
        phone: "+1234567890",
        source: "manual_test",
      });
      setTestLeadCreated(true);
    } catch (error) {
      console.error("Failed to create test lead:", error);
    }
  };

  const isSuccess = currentStep > TOTAL_STEPS;
  const progress = isSuccess ? 100 : (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      {!isSuccess && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{currentStep === 0 ? "" : `Step ${currentStep} of ${TOTAL_STEPS}`}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="relative min-h-[460px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {currentStep === 0 && <StepWelcome />}
            {currentStep === 1 && (
              <StepBusinessInfo
                data={{
                  companyName: data.companyName,
                  industry: data.industry,
                  whatYouSell: data.whatYouSell,
                }}
                onUpdate={updateData}
              />
            )}
            {currentStep === 2 && (
              <StepGoal
                data={{ goal: data.goal }}
                onUpdate={updateData}
              />
            )}
            {currentStep === 3 && (
              <StepResponseSpeed
                data={{ responseSpeed: data.responseSpeed }}
                onUpdate={updateData}
              />
            )}
            {currentStep === 4 && (
              <StepMessages
                data={{
                  sequence: data.sequence,
                  companyName: data.companyName,
                  whatYouSell: data.whatYouSell,
                }}
                onUpdate={updateData}
              />
            )}
            {currentStep === 5 && (
              <StepLeadSource
                data={{ leadSource: data.leadSource }}
                onUpdate={updateData}
              />
            )}
            {currentStep > TOTAL_STEPS && (
              <StepSuccess
                data={data}
                onCreateTestLead={handleCreateTestLead}
                testLeadCreated={testLeadCreated}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      {!isSuccess && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={currentStep === 0}
            className={cn(
              "text-gray-500",
              currentStep === 0 && "invisible"
            )}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            type="button"
            onClick={goNext}
            disabled={!isStepValid(currentStep) || isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 px-8"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Setting up...
              </span>
            ) : currentStep === 0 ? (
              <>
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : currentStep === TOTAL_STEPS ? (
              <>
                Finish Setup
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
