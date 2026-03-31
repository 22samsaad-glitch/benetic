"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BusinessType } from "@/types";

interface StepWhatYouSellProps {
  data: {
    businessType: BusinessType | null;
    productName: string;
    productDescription: string;
    websiteUrl: string;
  };
  onUpdate: (updates: Partial<{
    businessType: BusinessType;
    productName: string;
    productDescription: string;
    websiteUrl: string;
  }>) => void;
}

const options = [
  {
    value: "products" as BusinessType,
    title: "Products",
    description: "Physical goods, digital downloads, or software",
    placeholder: "e.g. Handmade candles, Notion templates, SaaS app",
  },
  {
    value: "services" as BusinessType,
    title: "Services",
    description: "Consulting, freelance, agency, or professional services",
    placeholder: "e.g. Web design, bookkeeping, personal training",
  },
];

export default function StepWhatYouSell({ data, onUpdate }: StepWhatYouSellProps) {
  const selected = options.find((o) => o.value === data.businessType);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = data.businessType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onUpdate({ businessType: option.value })}
              className={cn(
                "w-full flex items-center gap-4 p-5 border transition-all duration-150 text-left hover:-translate-y-0.5 active:translate-y-0",
                isSelected
                  ? "rounded-r-2xl rounded-l-none border-l-4 border-l-blue-600 border-t border-r border-b border-border bg-blue-50"
                  : "rounded-2xl border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/40"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-sm", isSelected ? "text-primary" : "text-foreground")}>
                  {option.title}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{option.description}</p>
              </div>
              <div className={cn(
                "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                isSelected ? "border-primary bg-primary" : "border-border"
              )}>
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {data.businessType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-2xl border border-border p-5 shadow-card space-y-4 mb-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  What specifically do you {data.businessType === "products" ? "sell" : "offer"}?
                  <span className="text-destructive ml-0.5">*</span>
                </Label>
                <Input
                  value={data.productName}
                  onChange={(e) => onUpdate({ productName: e.target.value })}
                  placeholder={selected?.placeholder}
                  className="h-11 rounded-xl bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Describe it in 1–2 sentences
                  <span className="ml-2 text-xs font-normal text-muted-foreground">(personalizes your messages)</span>
                </Label>
                <Textarea
                  value={data.productDescription}
                  onChange={(e) => onUpdate({ productDescription: e.target.value })}
                  placeholder={
                    data.businessType === "products"
                      ? "e.g. We sell handcrafted soy candles with clean, natural ingredients."
                      : "e.g. We help small businesses book more clients through automated follow-up."
                  }
                  rows={2}
                  className="rounded-xl bg-background resize-none text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Website URL
                  <span className="ml-2 text-xs font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  value={data.websiteUrl}
                  onChange={(e) => onUpdate({ websiteUrl: e.target.value })}
                  placeholder="https://yourwebsite.com"
                  type="url"
                  className="h-11 rounded-xl bg-background"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
