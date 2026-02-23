"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { pipelines } from "@/lib/api";
import { toast } from "sonner";

interface AddStageDialogProps {
  pipelineId: string;
  stageCount: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStageDialog({
  pipelineId,
  stageCount,
  open,
  onClose,
  onSuccess,
}: AddStageDialogProps) {
  const [name, setName] = useState("");
  const [isTerminal, setIsTerminal] = useState(false);
  const queryClient = useQueryClient();

  const addStageMutation = useMutation({
    mutationFn: () =>
      pipelines.addStage(pipelineId, {
        name,
        position: stageCount,
        is_terminal: isTerminal,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      toast.success("Stage added successfully");
      setName("");
      setIsTerminal(false);
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to add stage");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addStageMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Stage</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="stage-name" className="text-sm font-medium">
                Stage Name
              </label>
              <Input
                id="stage-name"
                placeholder="e.g. Qualified, Proposal, Closed Won"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="stage-position" className="text-sm font-medium">
                Position
              </label>
              <Input
                id="stage-position"
                value={stageCount}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                New stage will be added at the end of the pipeline.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-terminal"
                checked={isTerminal}
                onChange={(e) => setIsTerminal(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="is-terminal" className="text-sm">
                Terminal stage (e.g. Closed Won, Lost)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || addStageMutation.isPending}
            >
              {addStageMutation.isPending ? "Adding..." : "Add Stage"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
