"use client";

import { Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import type { Lead } from "@/types";

interface KanbanCardProps {
  lead: Lead;
  index: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (score >= 50) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

export default function KanbanCard({ lead, index }: KanbanCardProps) {
  const displayName = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unknown";

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="mb-2"
        >
          <motion.div
            layout
            initial={false}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
          >
            <Card
              className={cn(
                "cursor-pointer border border-border bg-card p-3 transition-shadow",
                snapshot.isDragging
                  ? "shadow-lg ring-2 ring-primary/20 rotate-[2deg]"
                  : "hover:shadow-md"
              )}
              onClick={() => {
                console.log("Open lead detail:", lead.id);
              }}
            >
              <div className="flex items-start gap-2">
                {/* Drag handle */}
                <div
                  {...provided.dragHandleProps}
                  className="mt-0.5 flex-shrink-0 cursor-grab text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">
                      {displayName}
                    </span>
                  </div>

                  {lead.email && (
                    <p className="text-xs text-muted-foreground truncate mb-1.5">
                      {lead.email}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] px-1.5 py-0", getScoreColor(lead.score))}
                    >
                      {lead.score}
                    </Badge>

                    {lead.source && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {lead.source}
                      </Badge>
                    )}
                  </div>

                  <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                    {formatRelativeTime(lead.updated_at)}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </Draggable>
  );
}
