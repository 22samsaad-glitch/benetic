"use client";

import { useState } from "react";
import { Mail, MessageSquare, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SequenceMessage } from "@/types";

interface StepMessagesProps {
  data: {
    sequence: SequenceMessage[];
    productName: string;
    companyName: string;
    whatYouSell: string;
  };
  onUpdate: (updates: { sequence: SequenceMessage[] }) => void;
}

const TIMING_OPTIONS = [
  { value: 0,     label: "Instantly" },
  { value: 60,    label: "1 hour later" },
  { value: 240,   label: "4 hours later" },
  { value: 1440,  label: "1 day later" },
  { value: 2880,  label: "2 days later" },
  { value: 4320,  label: "3 days later" },
  { value: 7200,  label: "5 days later" },
  { value: 10080, label: "1 week later" },
  { value: 20160, label: "2 weeks later" },
];

const VARIABLES = [
  "{{first_name}}",
  "{{company_name}}",
  "{{service_name}}",
  "{{your_business_name}}",
];

function timingLabel(minutes: number): string {
  const opt = TIMING_OPTIONS.find((o) => o.value === minutes);
  if (opt) return opt.label;
  if (minutes === 0) return "Instantly";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

function previewBody(text: string, productName: string): string {
  return text
    .replace(/\{\{first_name\}\}/g, "Sarah")
    .replace(/\{\{company_name\}\}/g, "Acme Corp")
    .replace(/\{\{service_name\}\}/g, productName || "your service")
    .replace(/\{\{your_business_name\}\}/g, "Your Business");
}

export default function StepMessages({ data, onUpdate }: StepMessagesProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    data.sequence[0]?.id ?? null
  );
  const [previewId, setPreviewId] = useState<string | null>(null);

  const messages = data.sequence;

  const updateMessage = (id: string, updates: Partial<SequenceMessage>) => {
    onUpdate({ sequence: messages.map((m) => (m.id === id ? { ...m, ...updates } : m)) });
  };

  const removeMessage = (id: string) => {
    if (messages.length <= 2) return;
    const next = messages.filter((m) => m.id !== id);
    onUpdate({ sequence: next });
    if (expandedId === id) setExpandedId(next[0]?.id ?? null);
  };

  const addMessage = () => {
    if (messages.length >= 5) return;
    const lastDelay = messages[messages.length - 1]?.delayMinutes ?? 0;
    const nextDelay = lastDelay === 0 ? 1440 : Math.min(lastDelay * 2, 20160);
    const newMsg: SequenceMessage = {
      id: `msg-${Date.now()}`,
      label: `Message ${messages.length + 1}`,
      channel: "email",
      enabled: true,
      delayMinutes: nextDelay,
      subject: "Following up",
      body: "Hi {{first_name}},\n\nJust wanted to check in — any questions I can answer?\n\n{{your_business_name}}",
    };
    onUpdate({ sequence: [...messages, newMsg] });
    setExpandedId(newMsg.id);
  };

  const insertVariable = (id: string, variable: string) => {
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;
    updateMessage(id, { body: msg.body + " " + variable });
  };

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="flex items-start gap-0 px-1">
        {messages.map((msg, i) => (
          <div key={msg.id} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                  expandedId === msg.id
                    ? "bg-primary border-primary text-white"
                    : "bg-card border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {i + 1}
              </button>
              <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-[60px] truncate">
                {timingLabel(msg.delayMinutes)}
              </span>
            </div>
            {i < messages.length - 1 && (
              <div className="flex-1 h-px bg-border mx-1 mt-[-14px]" />
            )}
          </div>
        ))}
        {messages.length < 5 && (
          <div className="flex items-center ml-1 mt-[-14px]">
            <div className="w-px h-4 bg-border mx-2" />
            <button
              type="button"
              onClick={addMessage}
              className="w-8 h-8 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Message cards */}
      <div className="space-y-3">
        {messages.map((msg, index) => {
          const isExpanded = expandedId === msg.id;
          const isPreviewing = previewId === msg.id;
          const isEmail = msg.channel === "email";

          return (
            <div
              key={msg.id}
              className={cn(
                "rounded-2xl border transition-all overflow-hidden bg-card",
                isExpanded ? "border-primary ring-1 ring-primary/20" : "border-border"
              )}
            >
              {/* Card header */}
              <div
                className={cn(
                  "flex items-center gap-3 p-4 cursor-pointer select-none",
                  isExpanded ? "bg-accent/30 border-b border-primary/10" : "hover:bg-muted/40"
                )}
                onClick={() => setExpandedId(isExpanded ? null : msg.id)}
              >
                <div className={cn(
                  "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                  isEmail ? "bg-primary/10 text-primary" : "bg-emerald-100 text-emerald-700"
                )}>
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{msg.label}</p>
                  <p className="text-xs text-muted-foreground">{timingLabel(msg.delayMinutes)} · {isEmail ? "Email" : "SMS"}</p>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {messages.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeMessage(msg.id)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </div>

              {/* Expanded editor */}
              {isExpanded && (
                <div className="p-4 space-y-4">
                  {/* Row: Timing + Channel + Label */}
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1.5 flex-1 min-w-[140px]">
                      <Label className="text-xs font-medium text-muted-foreground">Send timing</Label>
                      <Select
                        value={String(msg.delayMinutes)}
                        onValueChange={(v) => updateMessage(msg.id, { delayMinutes: Number(v) })}
                      >
                        <SelectTrigger className="h-9 text-sm rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMING_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={String(opt.value)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Channel</Label>
                      <div className="flex rounded-xl border border-border overflow-hidden h-9">
                        <button
                          type="button"
                          onClick={() => updateMessage(msg.id, { channel: "email" })}
                          className={cn(
                            "flex items-center gap-1.5 px-3 text-xs font-medium transition-colors",
                            isEmail ? "bg-primary text-white" : "bg-card text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <Mail className="w-3 h-3" />
                          Email
                        </button>
                        <button
                          type="button"
                          onClick={() => updateMessage(msg.id, { channel: "sms" })}
                          className={cn(
                            "flex items-center gap-1.5 px-3 text-xs font-medium transition-colors border-l border-border",
                            !isEmail ? "bg-emerald-600 text-white" : "bg-card text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <MessageSquare className="w-3 h-3" />
                          SMS
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-[120px]">
                      <Label className="text-xs font-medium text-muted-foreground">Label</Label>
                      <Input
                        value={msg.label}
                        onChange={(e) => updateMessage(msg.id, { label: e.target.value })}
                        className="h-9 text-sm rounded-xl"
                        placeholder="e.g. Follow-up"
                      />
                    </div>
                  </div>

                  {/* Subject (email only) */}
                  {isEmail && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-muted-foreground">Subject line</Label>
                        <span className={cn(
                          "text-xs",
                          msg.subject.length > 60 ? "text-orange-500 font-medium" : "text-muted-foreground"
                        )}>
                          {msg.subject.length}/60
                        </span>
                      </div>
                      {isPreviewing ? (
                        <p className="text-sm p-3 bg-muted rounded-xl border border-border">
                          {previewBody(msg.subject, data.productName)}
                        </p>
                      ) : (
                        <Input
                          value={msg.subject}
                          onChange={(e) => updateMessage(msg.id, { subject: e.target.value })}
                          placeholder="Email subject line"
                          className="text-sm rounded-xl"
                        />
                      )}
                    </div>
                  )}

                  {/* Body */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground">
                        {isEmail ? "Email body" : "SMS message"}
                      </Label>
                      <div className="flex items-center gap-3">
                        {!isEmail && (
                          <span className={cn(
                            "text-xs",
                            msg.body.length > 160 ? "text-destructive font-medium" : "text-muted-foreground"
                          )}>
                            {msg.body.length}/160
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setPreviewId(isPreviewing ? null : msg.id)}
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          {isPreviewing ? "Edit" : "Preview"}
                        </button>
                      </div>
                    </div>

                    {isPreviewing ? (
                      <div className="text-sm p-3 bg-muted rounded-xl border border-border whitespace-pre-wrap min-h-[80px]">
                        {previewBody(msg.body, data.productName)}
                      </div>
                    ) : (
                      <>
                        <Textarea
                          value={msg.body}
                          onChange={(e) => updateMessage(msg.id, { body: e.target.value })}
                          placeholder="Write your message..."
                          rows={isEmail ? 6 : 3}
                          className="text-sm resize-none rounded-xl"
                        />
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-xs text-muted-foreground">Insert:</span>
                          {VARIABLES.map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => insertVariable(msg.id, v)}
                              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors font-mono"
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add message button */}
      {messages.length < 5 && (
        <Button
          type="button"
          variant="outline"
          onClick={addMessage}
          className="w-full border-dashed rounded-xl text-muted-foreground hover:text-primary hover:border-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add another message ({messages.length}/5)
        </Button>
      )}

    </div>
  );
}
