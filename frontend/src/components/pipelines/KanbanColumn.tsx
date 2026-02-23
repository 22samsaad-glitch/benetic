"use client";

import { Droppable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { PipelineStage, Lead } from "@/types";
import KanbanCard from "./KanbanCard";

interface KanbanColumnProps {
  stage: PipelineStage;
  leads: Lead[];
  index: number;
}

const COLUMN_COLORS = [
  "border-t-blue-500",
  "border-t-violet-500",
  "border-t-amber-500",
  "border-t-emerald-500",
  "border-t-rose-500",
  "border-t-cyan-500",
  "border-t-orange-500",
  "border-t-indigo-500",
  "border-t-teal-500",
  "border-t-pink-500",
];

export default function KanbanColumn({ stage, leads, index }: KanbanColumnProps) {
  const colorClass = COLUMN_COLORS[index % COLUMN_COLORS.length];

  return (
    <div
      className={cn(
        "flex flex-col w-[300px] min-w-[300px] rounded-lg border border-border bg-muted/30 border-t-[3px]",
        colorClass
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-semibold truncate">{stage.name}</h3>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
            {leads.length}
          </Badge>
          {stage.is_terminal && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0 border-emerald-300 text-emerald-600">
              Final
            </Badge>
          )}
        </div>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 overflow-y-auto p-2 min-h-[120px] transition-colors duration-200",
              snapshot.isDraggingOver && "bg-primary/5"
            )}
          >
            {leads.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-full min-h-[80px]">
                <p className="text-xs text-muted-foreground/60">No leads</p>
              </div>
            )}

            {leads.map((lead, leadIndex) => (
              <KanbanCard key={lead.id} lead={lead} index={leadIndex} />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
