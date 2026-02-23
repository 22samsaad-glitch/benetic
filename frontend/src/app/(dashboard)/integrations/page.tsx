"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { integrations } from "@/lib/api";
import { IntegrationConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Mail, MessageSquare, BarChart3, Share2, CheckCircle2, Loader2, Plug, X, Webhook, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const PROVIDERS = [
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Send transactional and marketing emails",
    icon: Mail,
    color: "text-blue-600 bg-blue-100",
    fields: [{ key: "api_key", label: "API Key", type: "password" }],
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "Send SMS messages to leads",
    icon: MessageSquare,
    color: "text-red-600 bg-red-100",
    fields: [
      { key: "account_sid", label: "Account SID", type: "text" },
      { key: "auth_token", label: "Auth Token", type: "password" },
      { key: "from_number", label: "From Number", type: "text" },
    ],
  },
  {
    id: "resend",
    name: "Resend",
    description: "Modern email API for developers",
    icon: Mail,
    color: "text-violet-600 bg-violet-100",
    fields: [{ key: "api_key", label: "API Key", type: "password" }],
  },
  {
    id: "meta_lead_ads",
    name: "Meta Lead Ads",
    description: "Capture leads from Facebook & Instagram ads",
    icon: Share2,
    color: "text-indigo-600 bg-indigo-100",
    fields: [
      { key: "page_id", label: "Page ID", type: "text" },
      { key: "access_token", label: "Access Token", type: "password" },
    ],
  },
  {
    id: "google_ads",
    name: "Google Ads",
    description: "Import leads from Google Ads lead forms",
    icon: BarChart3,
    color: "text-emerald-600 bg-emerald-100",
    fields: [
      { key: "customer_id", label: "Customer ID", type: "text" },
      { key: "developer_token", label: "Developer Token", type: "password" },
    ],
  },
];

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [webhookCopied, setWebhookCopied] = useState(false);

  const webhookUrl = `${typeof window !== "undefined" ? window.location.origin.replace("3000", "8000") : ""}/api/v1/webhooks/ingest/your-slug`;

  const copyWebhookUrl = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2000);
  };

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: integrations.list,
  });

  const createMutation = useMutation({
    mutationFn: (provider: string) =>
      integrations.create({ provider, credentials }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Integration connected");
      setConfiguring(null);
      setCredentials({});
    },
    onError: () => toast.error("Failed to connect"),
  });

  const deleteMutation = useMutation({
    mutationFn: integrations.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Integration disconnected");
    },
  });

  const testMutation = useMutation({
    mutationFn: integrations.test,
    onSuccess: (data) => {
      if (data.success) toast.success("Connection successful");
      else toast.error(data.message || "Connection failed");
    },
    onError: () => toast.error("Test failed"),
  });

  const getConfig = (providerId: string): IntegrationConfig | undefined =>
    configs.find((c: IntegrationConfig) => c.provider === providerId);

  const provider = PROVIDERS.find((p) => p.id === configuring);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Lead Sources</h1>
      </div>

      {/* Webhook URL Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2.5 text-blue-600 bg-blue-100">
              <Webhook className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Webhook URL</CardTitle>
              <CardDescription>Send leads from any platform via HTTP POST</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white rounded-lg border p-2.5 break-all font-mono text-gray-700">
              {webhookUrl}
            </code>
            <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
              {webhookCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            POST JSON with: email, phone, first_name, last_name, source. Include <code className="font-mono bg-white px-1 rounded">X-API-Key</code> header.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PROVIDERS.map((p) => {
            const config = getConfig(p.id);
            const isConnected = !!config?.is_active;
            return (
              <Card key={p.id} className={isConnected ? "border-emerald-200 bg-emerald-50/50" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`rounded-lg p-2.5 ${p.color}`}>
                      <p.icon className="h-5 w-5" />
                    </div>
                    {isConnected && (
                      <Badge variant="success">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Connected
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mt-3">{p.name}</CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {isConnected ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testMutation.mutate(config!.id)}
                        disabled={testMutation.isPending}
                      >
                        {testMutation.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(config!.id)}
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => setConfiguring(p.id)}>
                      <Plug className="mr-2 h-4 w-4" />
                      Connect
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!configuring} onOpenChange={() => { setConfiguring(null); setCredentials({}); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {provider?.name}</DialogTitle>
            <DialogDescription>Enter your {provider?.name} credentials</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {provider?.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                <Input
                  type={field.type}
                  value={credentials[field.key] || ""}
                  onChange={(e) =>
                    setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfiguring(null); setCredentials({}); }}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(configuring!)}
              disabled={createMutation.isPending || !provider?.fields.every((f) => credentials[f.key])}
            >
              {createMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting...</>
              ) : (
                "Connect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
