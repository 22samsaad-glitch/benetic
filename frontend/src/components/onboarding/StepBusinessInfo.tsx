"use client";

import { Building2, Briefcase, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INDUSTRIES = [
  "Real Estate",
  "Insurance",
  "Financial Services",
  "Healthcare",
  "SaaS",
  "Agency",
  "E-commerce",
  "Education",
  "Home Services",
  "Other",
];

interface StepBusinessInfoProps {
  data: {
    companyName: string;
    industry: string;
    whatYouSell: string;
  };
  onUpdate: (updates: Partial<StepBusinessInfoProps["data"]>) => void;
}

export default function StepBusinessInfo({ data, onUpdate }: StepBusinessInfoProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-primary mb-2">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Tell us about your business</h2>
        <p className="text-muted-foreground">
          We&apos;ll personalize your follow-up messages based on this.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-sm font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            Company Name
          </Label>
          <Input
            id="companyName"
            placeholder="Acme Inc."
            value={data.companyName}
            onChange={(e) => onUpdate({ companyName: e.target.value })}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry" className="text-sm font-medium flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            Industry
          </Label>
          <Select
            value={data.industry}
            onValueChange={(value) => onUpdate({ industry: value })}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatYouSell" className="text-sm font-medium flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
            What do you sell?
          </Label>
          <Input
            id="whatYouSell"
            placeholder="e.g. Marketing consulting, Home renovations, Insurance policies"
            value={data.whatYouSell}
            onChange={(e) => onUpdate({ whatYouSell: e.target.value })}
            className="h-11"
          />
        </div>
      </div>
    </div>
  );
}
