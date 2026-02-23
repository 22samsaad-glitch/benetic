"use client";

import { useState, useCallback } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import type { PipelineStage, Lead } from "@/types";
import KanbanColumn from "./KanbanColumn";

interface KanbanBoardProps {
  stages: PipelineStage[];
  leads: Lead[];
  onMoveLead: (leadId: string, stageId: string) => Promise<void>;
}

export default function KanbanBoard({ stages, leads, onMoveLead }: KanbanBoardProps) {
  // Local state for optimistic updates
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads);

  // Sync when props change (e.g. after refetch)
  const [prevLeads, setPrevLeads] = useState(leads);
  if (leads !== prevLeads) {
    setPrevLeads(leads);
    setLocalLeads(leads);
  }

  const getLeadsForStage = useCallback(
    (stageId: string) =>
      localLeads.filter((lead) => lead.stage_id === stageId),
    [localLeads]
  );

  const sortedStages = [...stages].sort((a, b) => a.position - b.position);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { draggableId, destination, source } = result;

      // Dropped outside a droppable or same position
      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      const leadId = draggableId;
      const newStageId = destination.droppableId;

      // Optimistic update
      const previousLeads = localLeads;
      setLocalLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, stage_id: newStageId } : lead
        )
      );

      try {
        await onMoveLead(leadId, newStageId);
      } catch {
        // Rollback on error
        setLocalLeads(previousLeads);
        toast.error("Failed to move lead. Please try again.");
      }
    },
    [localLeads, onMoveLead]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-full px-1">
        {sortedStages.map((stage, index) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            leads={getLeadsForStage(stage.id)}
            index={index}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
