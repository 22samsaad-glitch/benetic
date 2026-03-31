"use client";

import { Building2, Users, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const INDUSTRIES = [
  "Real Estate",
  "Insurance",
  "Financial Services",
  "Healthcare",
  "SaaS",
  "Agency",
  "E-commerce",
  "Other",
];

const TEAM_SIZES = [
  { value: "1", label: "Just me", description: "Solo founder or freelancer" },
  { value: "2-5", label: "2-5", description: "Small team" },
  { value: "6-20", label: "6-20", description: "Growing team" },
  { value: "20+", label: "20+", description: "Larger organization" },
];

interface StepCompanyProps {
  data: {
    companyName: string;
    industry: string;
    teamSize: string;
  };
  onUpdate: (updates: Partial<StepCompanyProps["data"]>) => void;
}

export default function StepCompany({ data, onUpdate }: StepCompanyProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-primary mb-2">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Tell us about your company</h2>
        <p className="text-muted-foreground">
          We&apos;ll customize your experience based on your business.
        </p>
      </div>

      <div className="space-y-6">
        {/* Company Name */}
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

        {/* Industry */}
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

        {/* Team Size */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            Team Size
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {TEAM_SIZES.map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={() => onUpdate({ teamSize: size.value })}
                className={cn(
                  "flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 text-left",
                  data.teamSize === size.value
                    ? "border-primary bg-primary/5 shadow-card"
                    : "border-border hover:border-muted-foreground/40 hover:bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    "text-sm font-semibold",
                    data.teamSize === size.value ? "text-primary" : "text-foreground"
                  )}
                >
                  {size.label}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">{size.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
