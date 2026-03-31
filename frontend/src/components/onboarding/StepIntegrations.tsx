"use client";

import { Check, ExternalLink, Mail, MessageSquare, Facebook, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Send automated emails and track opens, clicks, and deliveries.",
    icon: <Mail className="w-6 h-6" />,
    color: "text-primary",
    bgColor: "bg-secondary",
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "Send SMS messages and automate text-based follow-ups.",
    icon: <MessageSquare className="w-6 h-6" />,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    id: "meta",
    name: "Meta Lead Ads",
    description: "Automatically import leads from your Facebook and Instagram campaigns.",
    icon: <Facebook className="w-6 h-6" />,
    color: "text-primary",
    bgColor: "bg-indigo-100",
  },
  {
    id: "google_ads",
    name: "Google Ads",
    description: "Import leads from Google Ads lead form extensions.",
    icon: <BarChart3 className="w-6 h-6" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
];

interface StepIntegrationsProps {
  data: {
    connectedIntegrations: string[];
  };
  onUpdate: (updates: { connectedIntegrations: string[] }) => void;
}

export default function StepIntegrations({ data, onUpdate }: StepIntegrationsProps) {
  const connected = data.connectedIntegrations;

  const toggleIntegration = (id: string) => {
    if (connected.includes(id)) {
      onUpdate({ connectedIntegrations: connected.filter((i) => i !== id) });
    } else {
      onUpdate({ connectedIntegrations: [...connected, id] });
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-primary mb-2">
          <ExternalLink className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Connect your tools</h2>
        <p className="text-muted-foreground">
          Power up your workflows by connecting your favorite services.
        </p>
      </div>

      <div className="grid gap-4">
        {INTEGRATIONS.map((integration) => {
          const isConnected = connected.includes(integration.id);
          return (
            <div
              key={integration.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
                isConnected
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-border bg-card hover:border-muted-foreground/40"
              )}
            >
              <div
                className={cn(
                  "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                  integration.bgColor,
                  integration.color
                )}
              >
                {integration.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{integration.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>
              </div>
              <div className="shrink-0">
                {isConnected ? (
                  <button
                    type="button"
                    onClick={() => toggleIntegration(integration.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-medium hover:bg-emerald-200 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Connected
                  </button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleIntegration(integration.id)}
                    className="text-sm"
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        All integrations are optional. You can always set these up later in Settings.
      </p>
    </div>
  );
}
