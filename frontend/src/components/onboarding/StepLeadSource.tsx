"use client";

import { useState } from "react";
import { Webhook, Facebook, UserPlus, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

type LeadSource = "webhook" | "meta" | "manual";

interface StepLeadSourceProps {
  data: {
    leadSource: LeadSource | null;
  };
  onUpdate: (updates: { leadSource: LeadSource }) => void;
}

export default function StepLeadSource({ data, onUpdate }: StepLeadSourceProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const tenantSlug = user?.tenant_id ?? "your-slug";
  const webhookUrl = `${window.location.origin.replace("3000", "8000")}/api/v1/webhooks/ingest/${tenantSlug}`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sources = [
    {
      value: "webhook" as LeadSource,
      icon: Webhook,
      title: "Webhook URL",
      description: "Send leads from any platform via HTTP POST",
    },
    {
      value: "meta" as LeadSource,
      icon: Facebook,
      title: "Facebook / Meta Ads",
      description: "Connect your Facebook Lead Ads (coming soon)",
      disabled: true,
    },
    {
      value: "manual" as LeadSource,
      icon: UserPlus,
      title: "Add manually",
      description: "Enter leads by hand from the dashboard",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Connect your lead source</h2>
        <p className="text-gray-500">
          How will leads arrive? You can always add more sources later.
        </p>
      </div>

      <div className="space-y-3">
        {sources.map((source) => {
          const Icon = source.icon;
          const selected = data.leadSource === source.value;
          const disabled = source.disabled;
          return (
            <button
              key={source.value}
              type="button"
              onClick={() => !disabled && onUpdate({ leadSource: source.value })}
              disabled={disabled}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                disabled
                  ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                  : selected
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <div
                className={cn(
                  "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                  selected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-semibold text-sm",
                    selected ? "text-blue-700" : "text-gray-900"
                  )}
                >
                  {source.title}
                  {disabled && (
                    <span className="ml-2 text-xs font-normal text-gray-400">Coming soon</span>
                  )}
                </p>
                <p className="text-sm text-gray-500">{source.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {data.leadSource === "webhook" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Your webhook URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white rounded-lg border p-2.5 break-all font-mono text-gray-700">
              {webhookUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Send a POST request with JSON body containing: email, phone, first_name, last_name, source.
            Add the header <code className="font-mono bg-white px-1 rounded">X-API-Key</code> with your tenant API key.
          </p>
        </div>
      )}
    </div>
  );
}
