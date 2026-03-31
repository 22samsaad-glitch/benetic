"use client";

import { useState } from "react";
import { Mail, Eye, EyeOff, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLACEHOLDER_VARIABLES = [
  { label: "first_name", example: "John" },
  { label: "company_name", example: "Acme Inc." },
  { label: "last_name", example: "Smith" },
];

const STARTER_TEMPLATE = {
  name: "Professional Follow-Up",
  subject: "Great connecting with you, {{first_name}}!",
  body: `Hi {{first_name}},

Thank you for your interest in {{company_name}}. I wanted to follow up on our recent conversation and see how I can help.

I'd love to schedule a quick call to learn more about your needs and show you how we can make a difference for your business.

Would you have 15 minutes this week for a brief chat?

Looking forward to hearing from you!

Best regards`,
};

interface StepTemplatesProps {
  data: {
    templateName: string;
    templateSubject: string;
    templateBody: string;
  };
  onUpdate: (updates: Partial<StepTemplatesProps["data"]>) => void;
}

export default function StepTemplates({ data, onUpdate }: StepTemplatesProps) {
  const [showPreview, setShowPreview] = useState(false);

  const insertVariable = (variable: string, field: "templateSubject" | "templateBody") => {
    const tag = `{{${variable}}}`;
    onUpdate({ [field]: (data[field] || "") + tag });
  };

  const renderPreview = (text: string) => {
    let result = text;
    PLACEHOLDER_VARIABLES.forEach((v) => {
      result = result.replace(
        new RegExp(`\\{\\{${v.label}\\}\\}`, "g"),
        `<span class="bg-secondary text-blue-700 px-1 rounded font-medium">${v.example}</span>`
      );
    });
    return result;
  };

  const useStarter = () => {
    onUpdate({
      templateName: STARTER_TEMPLATE.name,
      templateSubject: STARTER_TEMPLATE.subject,
      templateBody: STARTER_TEMPLATE.body,
    });
  };

  const hasContent = data.templateName || data.templateSubject || data.templateBody;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 mb-2">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Create your first template</h2>
        <p className="text-muted-foreground">
          Build an email template to reach out to your leads quickly.
        </p>
      </div>

      {/* Starter Template Button */}
      {!hasContent && (
        <button
          type="button"
          onClick={useStarter}
          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors text-left group"
        >
          <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-200 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Use a starter template</p>
            <p className="text-xs text-amber-600">
              Start with a professional follow-up email and customize it.
            </p>
          </div>
        </button>
      )}

      {/* Template Form */}
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="templateName" className="text-sm font-medium">
            Template Name
          </Label>
          <Input
            id="templateName"
            placeholder="e.g. Welcome Email, Follow-Up, etc."
            value={data.templateName}
            onChange={(e) => onUpdate({ templateName: e.target.value })}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="templateSubject" className="text-sm font-medium">
            Subject Line
          </Label>
          <Input
            id="templateSubject"
            placeholder="e.g. Great connecting with you, {{first_name}}!"
            value={data.templateSubject}
            onChange={(e) => onUpdate({ templateSubject: e.target.value })}
            className="h-11"
          />
        </div>

        {/* Variable chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Insert variable:</span>
          {PLACEHOLDER_VARIABLES.map((v) => (
            <Badge
              key={v.label}
              variant="outline"
              className="cursor-pointer hover:bg-muted hover:border-primary/30 transition-colors text-xs"
              onClick={() => insertVariable(v.label, "templateBody")}
            >
              {`{{${v.label}}}`}
            </Badge>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="templateBody" className="text-sm font-medium">
              Email Body
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-muted-foreground h-7"
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 mr-1" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Preview
                </>
              )}
            </Button>
          </div>

          {showPreview ? (
            <div className="min-h-[200px] p-4 rounded-xl border border-border bg-background text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              <div className="mb-3 pb-3 border-b border-border">
                <span className="text-xs text-muted-foreground">Subject: </span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: renderPreview(data.templateSubject || "(no subject)"),
                  }}
                />
              </div>
              <div
                dangerouslySetInnerHTML={{
                  __html: renderPreview(data.templateBody || "(empty body)"),
                }}
              />
            </div>
          ) : (
            <textarea
              id="templateBody"
              placeholder="Write your email here... Use {{first_name}}, {{company_name}}, etc. for personalization."
              value={data.templateBody}
              onChange={(e) => onUpdate({ templateBody: e.target.value })}
              rows={8}
              className={cn(
                "flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50 resize-none leading-relaxed"
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
