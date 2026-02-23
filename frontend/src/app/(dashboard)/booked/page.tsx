"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { leads, pipelines } from "@/lib/api";
import type { Lead, Pipeline, PipelineStage } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck,
  Clock,
  User,
  Mail,
  Phone,
  Loader2,
  CalendarX,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

const BOOKED_STAGE_PATTERNS = [
  "meeting booked",
  "booked",
  "call booked",
  "appointment",
  "scheduled",
  "demo booked",
  "consultation",
];

function isBookedStage(stageName: string): boolean {
  const lower = stageName.toLowerCase();
  return BOOKED_STAGE_PATTERNS.some((pattern) => lower.includes(pattern));
}

export default function BookedCallsPage() {
  const { data: leadsList = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["leads", "booked"],
    queryFn: () => leads.list({ per_page: 200 }),
  });

  const { data: pipelinesList = [], isLoading: pipelinesLoading } = useQuery({
    queryKey: ["pipelines"],
    queryFn: pipelines.list,
  });

  const allStages = useMemo(
    () => pipelinesList.flatMap((p: Pipeline) => p.stages || []),
    [pipelinesList]
  );

  const bookedStageIds = useMemo(
    () =>
      new Set(
        allStages
          .filter((s: PipelineStage) => isBookedStage(s.name))
          .map((s: PipelineStage) => s.id)
      ),
    [allStages]
  );

  const bookedLeads = useMemo(
    () =>
      leadsList.filter(
        (l: Lead) => l.stage_id && bookedStageIds.has(l.stage_id)
      ),
    [leadsList, bookedStageIds]
  );

  const getStageName = (stageId: string | null) => {
    if (!stageId) return "Unknown";
    const stage = allStages.find((s: PipelineStage) => s.id === stageId);
    return stage?.name ?? "Unknown";
  };

  const isLoading = leadsLoading || pipelinesLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Booked Calls
          </h1>
          {!isLoading && (
            <Badge variant="secondary">{bookedLeads.length}</Badge>
          )}
        </div>
      </div>

      {bookedStageIds.size === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarX className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No booking stage found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Add a pipeline stage like &quot;Meeting Booked&quot;,
              &quot;Appointment&quot;, or &quot;Demo Booked&quot; to your
              pipeline. Leads that reach that stage will appear here
              automatically.
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : bookedStageIds.size > 0 && bookedLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <CalendarCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No booked calls yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            When leads are moved to a booking stage, they&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookedLeads.map((lead: Lead) => (
            <Card
              key={lead.id}
              className="hover:shadow-md transition-shadow border-l-4 border-l-primary"
            >
              <CardContent className="pt-5 pb-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-2">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {[lead.first_name, lead.last_name]
                          .filter(Boolean)
                          .join(" ") || "Unknown"}
                      </p>
                      {lead.source && (
                        <p className="text-xs text-muted-foreground">
                          via {lead.source}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="success">
                    <CalendarCheck className="mr-1 h-3 w-3" />
                    Booked
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t">
                  <Badge variant="outline" className="text-xs">
                    {getStageName(lead.stage_id)}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(lead.updated_at)}
                  </div>
                </div>

                {lead.score > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(lead.score, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {lead.score}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
