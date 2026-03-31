"use client";

import { Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  X,
  Mail,
  Phone,
  Globe,
  Calendar,
  User as UserIcon,
  Activity,
  Pencil,
  Trash2,
  ExternalLink,
  Tag,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { leads, pipelines, team } from "@/lib/api";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Lead, LeadEvent, Pipeline, PipelineStage, User } from "@/types";

interface LeadDetailProps {
  leadId: string;
  open: boolean;
  onClose: () => void;
  onEdit?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
}

function getScoreBarColor(score: number) {
  if (score <= 30) return "bg-red-500";
  if (score <= 60) return "bg-yellow-500";
  return "bg-green-500";
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case "created":
      return <Calendar className="h-3.5 w-3.5" />;
    case "stage_changed":
      return <Target className="h-3.5 w-3.5" />;
    case "assigned":
      return <UserIcon className="h-3.5 w-3.5" />;
    case "email_sent":
    case "email_opened":
      return <Mail className="h-3.5 w-3.5" />;
    case "score_updated":
      return <Activity className="h-3.5 w-3.5" />;
    default:
      return <Activity className="h-3.5 w-3.5" />;
  }
}

function getEventLabel(event: LeadEvent) {
  const meta = event.metadata || {};
  switch (event.event_type) {
    case "created":
      return "Lead created";
    case "stage_changed":
      return `Moved to ${meta.stage_name || "new stage"}`;
    case "assigned":
      return `Assigned to ${meta.user_name || "team member"}`;
    case "email_sent":
      return `Email sent: ${meta.subject || ""}`;
    case "email_opened":
      return "Email opened";
    case "score_updated":
      return `Score updated to ${meta.new_score ?? ""}`;
    default:
      return event.event_type.replace(/_/g, " ");
  }
}

export default function LeadDetail({ leadId, open, onClose, onEdit, onDelete }: LeadDetailProps) {
  const queryClient = useQueryClient();

  const { data: lead, isLoading: leadLoading } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => leads.get(leadId),
    enabled: open && !!leadId,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["lead-events", leadId],
    queryFn: () => leads.events(leadId),
    enabled: open && !!leadId,
  });

  const { data: pipelineList = [] } = useQuery({
    queryKey: ["pipelines"],
    queryFn: pipelines.list,
    enabled: open,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team"],
    queryFn: team.list,
    enabled: open,
  });

  const allStages: PipelineStage[] = pipelineList.flatMap((p: Pipeline) => p.stages || []);

  const moveStageMutation = useMutation({
    mutationFn: ({ stageId }: { stageId: string }) => leads.moveStage(leadId, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["lead-events", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead moved to new stage");
    },
    onError: () => toast.error("Failed to move lead"),
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => leads.assign(leadId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead reassigned");
    },
    onError: () => toast.error("Failed to reassign lead"),
  });

  const name = lead ? [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unnamed" : "";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-card shadow-card-hover"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b px-6 py-4 border-border">
              <div className="flex items-center gap-3">
                {leadLoading ? (
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                ) : (
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  {leadLoading ? (
                    <>
                      <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                      <div className="mt-1 h-4 w-48 animate-pulse rounded bg-muted" />
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold text-foreground">{name}</h2>
                      <p className="text-sm text-muted-foreground">{lead?.email || "No email"}</p>
                    </>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {leadLoading ? (
                <div className="space-y-4 p-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : lead ? (
                <div className="space-y-6 p-6">
                  {/* Contact Info */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</h3>
                    <div className="space-y-2">
                      {lead.email && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{lead.email}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{lead.phone}</span>
                        </div>
                      )}
                      {lead.source && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{lead.source}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">
                          Created {format(new Date(lead.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Score */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lead Score</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${lead.score}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={cn("h-full rounded-full", getScoreBarColor(lead.score))}
                          />
                        </div>
                      </div>
                      <span className="text-lg font-bold tabular-nums text-foreground">{lead.score}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Stage */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pipeline Stage</h3>
                    <Select
                      value={lead.stage_id || ""}
                      onValueChange={(val) => moveStageMutation.mutate({ stageId: val })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="No stage assigned" />
                      </SelectTrigger>
                      <SelectContent>
                        {allStages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Assigned To */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned To</h3>
                    <Select
                      value={lead.assigned_to || ""}
                      onValueChange={(val) => assignMutation.mutate({ userId: val })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member: User) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* UTM Data */}
                  {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">UTM Data</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {lead.utm_source && (
                            <div className="rounded-lg bg-muted px-3 py-2">
                              <p className="text-[10px] font-medium uppercase text-muted-foreground">Source</p>
                              <p className="text-sm text-foreground">{lead.utm_source}</p>
                            </div>
                          )}
                          {lead.utm_medium && (
                            <div className="rounded-lg bg-muted px-3 py-2">
                              <p className="text-[10px] font-medium uppercase text-muted-foreground">Medium</p>
                              <p className="text-sm text-foreground">{lead.utm_medium}</p>
                            </div>
                          )}
                          {lead.utm_campaign && (
                            <div className="rounded-lg bg-muted px-3 py-2">
                              <p className="text-[10px] font-medium uppercase text-muted-foreground">Campaign</p>
                              <p className="text-sm text-foreground">{lead.utm_campaign}</p>
                            </div>
                          )}
                          {lead.utm_term && (
                            <div className="rounded-lg bg-muted px-3 py-2">
                              <p className="text-[10px] font-medium uppercase text-muted-foreground">Term</p>
                              <p className="text-sm text-foreground">{lead.utm_term}</p>
                            </div>
                          )}
                          {lead.utm_content && (
                            <div className="rounded-lg bg-muted px-3 py-2">
                              <p className="text-[10px] font-medium uppercase text-muted-foreground">Content</p>
                              <p className="text-sm text-foreground">{lead.utm_content}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Custom Fields */}
                  {lead.custom_fields && Object.keys(lead.custom_fields).length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom Fields</h3>
                        <div className="space-y-2">
                          {Object.entries(lead.custom_fields).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                              <span className="text-xs font-medium text-muted-foreground">{key}</span>
                              <span className="text-sm text-foreground">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Activity Timeline */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</h3>
                    {eventsLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-10 animate-pulse rounded bg-muted" />
                        ))}
                      </div>
                    ) : events.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No activity yet</p>
                    ) : (
                      <div className="relative space-y-0">
                        {events.map((event, i) => (
                          <div key={event.id} className="relative flex gap-3 pb-4">
                            {i < events.length - 1 && (
                              <div className="absolute left-[11px] top-6 h-full w-px bg-muted" />
                            )}
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                              {getEventIcon(event.event_type)}
                            </div>
                            <div className="flex-1 pt-0.5">
                              <p className="text-sm text-foreground">{getEventLabel(event)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer Actions */}
            {lead && (
              <div className="flex items-center justify-between border-t px-6 py-3 border-border">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onDelete?.(lead);
                    onClose();
                  }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete Lead
                </Button>
                <Button
                  size="sm"
                  onClick={() => onEdit?.(lead)}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
