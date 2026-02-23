"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pipelines, leads } from "@/lib/api";
import type { Pipeline } from "@/types";
import KanbanBoard from "@/components/pipelines/KanbanBoard";
import AddStageDialog from "@/components/pipelines/AddStageDialog";

// ── Loading skeleton ──
function KanbanSkeleton() {
  return (
    <div className="flex gap-4 h-full px-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-[300px] min-w-[300px] rounded-lg border border-border bg-muted/30 animate-pulse"
        >
          <div className="px-3 py-2.5 border-b border-border">
            <div className="h-4 w-24 bg-muted-foreground/10 rounded" />
          </div>
          <div className="p-2 space-y-2">
            {Array.from({ length: 2 + i }).map((_, j) => (
              <div
                key={j}
                className="h-[88px] rounded-lg bg-muted-foreground/5 border border-border"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PipelinesPage() {
  const queryClient = useQueryClient();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [addStageOpen, setAddStageOpen] = useState(false);

  // Fetch all pipelines
  const {
    data: pipelineList,
    isLoading: pipelinesLoading,
  } = useQuery({
    queryKey: ["pipelines"],
    queryFn: pipelines.list,
  });

  // Select the first pipeline by default
  const activePipelineId =
    selectedPipelineId ?? pipelineList?.[0]?.id ?? null;

  const activePipeline = pipelineList?.find(
    (p: Pipeline) => p.id === activePipelineId
  );

  // Fetch leads (all, we filter client-side by stage)
  const {
    data: leadList,
    isLoading: leadsLoading,
  } = useQuery({
    queryKey: ["leads"],
    queryFn: () => leads.list({ per_page: 200 }),
  });

  // Move lead mutation
  const moveLeadMutation = useMutation({
    mutationFn: ({ leadId, stageId }: { leadId: string; stageId: string }) =>
      leads.moveStage(leadId, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    },
  });

  const handleMoveLead = useCallback(
    async (leadId: string, stageId: string) => {
      await moveLeadMutation.mutateAsync({ leadId, stageId });
    },
    [moveLeadMutation]
  );

  const isLoading = pipelinesLoading || leadsLoading;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>

          {/* Pipeline selector */}
          {pipelineList && pipelineList.length > 1 && (
            <select
              value={activePipelineId ?? ""}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {pipelineList.map((p: Pipeline) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <Button
          size="sm"
          onClick={() => setAddStageOpen(true)}
          disabled={!activePipelineId}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Stage
        </Button>
      </div>

      {/* Kanban board area */}
      <div className="flex-1 overflow-hidden p-6">
        {isLoading ? (
          <KanbanSkeleton />
        ) : !activePipeline ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">No pipeline found.</p>
              <p className="text-sm text-muted-foreground/70">
                Create a pipeline to start managing your leads.
              </p>
            </div>
          </div>
        ) : activePipeline.stages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <p className="text-muted-foreground">No stages yet.</p>
              <Button size="sm" onClick={() => setAddStageOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add your first stage
              </Button>
            </div>
          </div>
        ) : (
          <KanbanBoard
            stages={activePipeline.stages}
            leads={leadList ?? []}
            onMoveLead={handleMoveLead}
          />
        )}
      </div>

      {/* Add Stage Dialog */}
      {activePipelineId && (
        <AddStageDialog
          pipelineId={activePipelineId}
          stageCount={activePipeline?.stages.length ?? 0}
          open={addStageOpen}
          onClose={() => setAddStageOpen(false)}
          onSuccess={() => setAddStageOpen(false)}
        />
      )}
    </div>
  );
}
