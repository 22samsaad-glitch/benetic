"use client";

import { useState } from "react";
import { Plus, X, GripVertical, ArrowRight, GitBranch } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PipelineStageData {
  id: string;
  name: string;
  isTerminal: boolean;
}

interface StepPipelineProps {
  data: {
    stages: PipelineStageData[];
  };
  onUpdate: (updates: { stages: PipelineStageData[] }) => void;
}

const STAGE_COLORS = [
  "bg-blue-500",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-pink-500",
  "bg-indigo-500",
];

export default function StepPipeline({ data, onUpdate }: StepPipelineProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const stages = data.stages;

  const startEdit = (stage: PipelineStageData) => {
    setEditingId(stage.id);
    setEditValue(stage.name);
  };

  const saveEdit = () => {
    if (!editingId || !editValue.trim()) return;
    const updated = stages.map((s) =>
      s.id === editingId ? { ...s, name: editValue.trim() } : s
    );
    onUpdate({ stages: updated });
    setEditingId(null);
    setEditValue("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") {
      setEditingId(null);
      setEditValue("");
    }
  };

  const addStage = () => {
    const nonTerminal = stages.filter((s) => !s.isTerminal);
    const terminal = stages.filter((s) => s.isTerminal);
    const newStage: PipelineStageData = {
      id: `stage-${Date.now()}`,
      name: "New Stage",
      isTerminal: false,
    };
    onUpdate({ stages: [...nonTerminal, newStage, ...terminal] });
    // Start editing the new stage immediately
    setTimeout(() => {
      setEditingId(newStage.id);
      setEditValue(newStage.name);
    }, 50);
  };

  const removeStage = (id: string) => {
    if (stages.length <= 2) return; // Keep at least 2 stages
    onUpdate({ stages: stages.filter((s) => s.id !== id) });
  };

  const getStageColor = (index: number) => {
    return STAGE_COLORS[index % STAGE_COLORS.length];
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 text-violet-600 mb-2">
          <GitBranch className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Design your pipeline</h2>
        <p className="text-gray-500">
          Define the stages your leads move through. Click any stage name to rename it.
        </p>
      </div>

      {/* Visual Pipeline Flow */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex items-center shrink-0">
              {/* Stage Card */}
              <div
                className={cn(
                  "relative group flex flex-col items-center",
                  stage.isTerminal && "opacity-90"
                )}
              >
                {/* Color dot */}
                <div
                  className={cn(
                    "w-3 h-3 rounded-full mb-2",
                    stage.isTerminal
                      ? stage.name === "Won"
                        ? "bg-emerald-500"
                        : "bg-rose-400"
                      : getStageColor(index)
                  )}
                />

                {/* Stage name / edit */}
                <div
                  className={cn(
                    "relative px-4 py-2.5 rounded-xl border-2 transition-all duration-200 min-w-[100px] text-center",
                    editingId === stage.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 cursor-pointer hover:bg-gray-50"
                  )}
                >
                  {editingId === stage.id ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={handleEditKeyDown}
                      className="h-7 text-sm text-center border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(stage)}
                      className="text-sm font-medium text-gray-700 w-full"
                    >
                      {stage.name}
                    </button>
                  )}

                  {/* Remove button */}
                  {!stage.isTerminal && stages.length > 2 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStage(stage.id);
                      }}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {/* Grip indicator */}
                  {!stage.isTerminal && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity">
                      <GripVertical className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Position label */}
                <span className="text-[10px] text-gray-400 mt-1.5 font-medium uppercase tracking-wider">
                  {stage.isTerminal ? "End" : `Step ${index + 1}`}
                </span>
              </div>

              {/* Arrow between stages */}
              {index < stages.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-300 mx-1 shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Add Stage button */}
        <div className="flex justify-center mt-6 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStage}
            className="text-gray-500 hover:text-gray-700"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Stage
          </Button>
        </div>
      </div>

      <p className="text-xs text-center text-gray-400">
        You can always customize your pipeline later in Settings.
      </p>
    </div>
  );
}
