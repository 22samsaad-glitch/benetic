"use client";

import { useState } from "react";
import { Mail, MessageSquare, Pencil, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SequenceMessage } from "@/types";

interface StepMessagesProps {
  data: {
    sequence: SequenceMessage[];
    companyName: string;
    whatYouSell: string;
  };
  onUpdate: (updates: { sequence: SequenceMessage[] }) => void;
}

const VARIABLES = ["{{first_name}}", "{{company_name}}"];

export default function StepMessages({ data, onUpdate }: StepMessagesProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    data.sequence.find((m) => m.enabled)?.id ?? null
  );
  const [previewMode, setPreviewMode] = useState(false);

  const enabledMessages = data.sequence.filter((m) => m.enabled);

  const updateMessage = (id: string, updates: Partial<SequenceMessage>) => {
    onUpdate({
      sequence: data.sequence.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    });
  };

  const insertVariable = (id: string, field: "subject" | "body", variable: string) => {
    const msg = data.sequence.find((m) => m.id === id);
    if (!msg) return;
    updateMessage(id, { [field]: msg[field] + " " + variable });
  };

  const previewText = (text: string) => {
    return text
      .replace(/\{\{first_name\}\}/g, "Sarah")
      .replace(/\{\{company_name\}\}/g, data.companyName || "Your Company");
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Your follow-up messages</h2>
        <p className="text-gray-500">
          These are pre-filled based on your business. Edit them to match your voice.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreviewMode(!previewMode)}
          className="text-xs"
        >
          {previewMode ? <Pencil className="w-3 h-3 mr-1.5" /> : <Eye className="w-3 h-3 mr-1.5" />}
          {previewMode ? "Edit" : "Preview"}
        </Button>
      </div>

      <div className="space-y-3">
        {enabledMessages.map((msg, index) => {
          const isExpanded = expandedId === msg.id;
          const isEmail = msg.channel === "email";
          const Icon = isEmail ? Mail : MessageSquare;

          return (
            <div
              key={msg.id}
              className={cn(
                "rounded-xl border-2 transition-all overflow-hidden",
                isExpanded ? "border-blue-200 bg-blue-50/30" : "border-gray-200"
              )}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div
                  className={cn(
                    "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                    isEmail ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400">
                      {index === 0
                        ? "Instant"
                        : msg.delayMinutes < 60
                        ? `After ${msg.delayMinutes}m`
                        : msg.delayMinutes < 1440
                        ? `After ${Math.round(msg.delayMinutes / 60)}h`
                        : `After ${Math.round(msg.delayMinutes / 1440)}d`}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        isEmail ? "text-blue-600" : "text-green-600"
                      )}
                    >
                      {isEmail ? "Email" : "SMS"}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {msg.label}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {isEmail && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Subject</Label>
                      {previewMode ? (
                        <p className="text-sm p-2 bg-white rounded border">
                          {previewText(msg.subject)}
                        </p>
                      ) : (
                        <Input
                          value={msg.subject}
                          onChange={(e) =>
                            updateMessage(msg.id, { subject: e.target.value })
                          }
                          placeholder="Email subject line"
                          className="h-9 text-sm"
                        />
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-gray-500">
                        {isEmail ? "Body" : "Message"}
                      </Label>
                      {!isEmail && (
                        <span
                          className={cn(
                            "text-xs",
                            msg.body.length > 160
                              ? "text-red-500"
                              : "text-gray-400"
                          )}
                        >
                          {msg.body.length}/160
                        </span>
                      )}
                    </div>
                    {previewMode ? (
                      <div className="text-sm p-3 bg-white rounded border whitespace-pre-wrap">
                        {previewText(msg.body)}
                      </div>
                    ) : (
                      <>
                        <Textarea
                          value={msg.body}
                          onChange={(e) =>
                            updateMessage(msg.id, { body: e.target.value })
                          }
                          placeholder="Message body..."
                          rows={isEmail ? 5 : 3}
                          className="text-sm resize-none"
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">Insert:</span>
                          {VARIABLES.map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() =>
                                insertVariable(
                                  msg.id,
                                  isEmail ? "body" : "body",
                                  v
                                )
                              }
                              className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
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
    </div>
  );
}
