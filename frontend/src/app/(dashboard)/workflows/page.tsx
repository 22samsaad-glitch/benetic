"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  Workflow as WorkflowIcon,
  Mail,
  MessageSquare,
  Clock,
  GitBranch,
  ArrowRight,
  UserPlus,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Trash2,
  Zap,
  Loader2,
} from "lucide-react";
import { workflows } from "@/lib/api";
import type { Workflow, WorkflowStep } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const TRIGGER_TYPES = [
  { value: "lead_created", label: "Lead Created" },
  { value: "stage_changed", label: "Stage Changed" },
  { value: "score_threshold", label: "Score Threshold" },
  { value: "manual", label: "Manual" },
] as const;

const STEP_TYPES = [
  { value: "send_email", label: "Send Email", icon: Mail },
  { value: "send_sms", label: "Send SMS", icon: MessageSquare },
  { value: "delay", label: "Delay", icon: Clock },
  { value: "condition", label: "Condition", icon: GitBranch },
  { value: "move_stage", label: "Move Stage", icon: ArrowRight },
  { value: "assign", label: "Assign", icon: UserPlus },
  { value: "create_task", label: "Create Task", icon: CheckSquare },
] as const;

const workflowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  trigger_type: z.string().min(1, "Trigger type is required"),
  steps: z
    .array(
      z.object({
        step_type: z.string().min(1, "Step type is required"),
        config: z.record(z.unknown()).default({}),
      })
    )
    .min(1, "At least one step is required"),
});

type WorkflowFormValues = z.infer<typeof workflowSchema>;

function getStepIcon(stepType: string) {
  const step = STEP_TYPES.find((s) => s.value === stepType);
  return step?.icon || Zap;
}

function getStepLabel(stepType: string) {
  const step = STEP_TYPES.find((s) => s.value === stepType);
  return step?.label || stepType;
}

function getTriggerLabel(triggerType: string) {
  const trigger = TRIGGER_TYPES.find((t) => t.value === triggerType);
  return trigger?.label || triggerType;
}

export default function WorkflowsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: workflowList, isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: workflows.list,
  });

  const createMutation = useMutation({
    mutationFn: workflows.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow created successfully");
      setCreateOpen(false);
    },
    onError: () => {
      toast.error("Failed to create workflow");
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => workflows.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow activated");
    },
    onError: () => {
      toast.error("Failed to activate workflow");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => workflows.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow deactivated");
    },
    onError: () => {
      toast.error("Failed to deactivate workflow");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workflows.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow deleted");
    },
    onError: () => {
      toast.error("Failed to delete workflow");
    },
  });

  const handleToggle = (workflow: Workflow) => {
    if (workflow.is_active) {
      deactivateMutation.mutate(workflow.id);
    } else {
      activateMutation.mutate(workflow.id);
    }
  };

  const form = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: "",
      trigger_type: "",
      steps: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const onSubmit = (data: WorkflowFormValues) => {
    createMutation.mutate({
      name: data.name,
      trigger_type: data.trigger_type,
      steps: data.steps.map((step, index) => ({
        position: index + 1,
        step_type: step.step_type,
        config: step.config,
      })),
    });
  };

  const handleOpenCreate = () => {
    form.reset({ name: "", trigger_type: "", steps: [] });
    setCreateOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-36 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Follow-up Sequences</h1>
          <p className="text-muted-foreground">
            Automated sequences that respond to new leads instantly.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Sequence
        </Button>
      </div>

      {/* Workflow Grid */}
      {!workflowList || workflowList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <WorkflowIcon className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No sequences yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first follow-up sequence to respond to leads automatically.
            </p>
            <Button onClick={handleOpenCreate} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Sequence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {workflowList.map((workflow) => {
              const isExpanded = expandedId === workflow.id;
              return (
                <motion.div
                  key={workflow.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={isExpanded ? "md:col-span-2 lg:col-span-3" : ""}
                >
                  <Card className="relative overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {workflow.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Trigger: {getTriggerLabel(workflow.trigger_type)}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              workflow.is_active ? "default" : "secondary"
                            }
                          >
                            {workflow.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Switch
                            checked={workflow.is_active}
                            onCheckedChange={() => handleToggle(workflow)}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5" />
                          {workflow.steps?.length || 0} step
                          {(workflow.steps?.length || 0) !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Step pills */}
                      {workflow.steps && workflow.steps.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {(isExpanded
                            ? workflow.steps
                            : workflow.steps.slice(0, 3)
                          )
                            .sort((a, b) => a.position - b.position)
                            .map((step: WorkflowStep, idx: number) => {
                              const StepIcon = getStepIcon(step.step_type);
                              return (
                                <Badge
                                  key={step.id || idx}
                                  variant="outline"
                                  className="gap-1 text-xs"
                                >
                                  <StepIcon className="h-3 w-3" />
                                  {getStepLabel(step.step_type)}
                                </Badge>
                              );
                            })}
                          {!isExpanded && workflow.steps.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{workflow.steps.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 pt-2"
                          >
                            <Separator />
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">
                                Workflow Steps
                              </h4>
                              <div className="space-y-2">
                                {workflow.steps
                                  .sort((a, b) => a.position - b.position)
                                  .map((step: WorkflowStep, idx: number) => {
                                    const StepIcon = getStepIcon(
                                      step.step_type
                                    );
                                    return (
                                      <div
                                        key={step.id || idx}
                                        className="flex items-center gap-3 rounded-md border p-3"
                                      >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                          <StepIcon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm font-medium">
                                            Step {step.position}:{" "}
                                            {getStepLabel(step.step_type)}
                                          </p>
                                          {Object.keys(step.config).length >
                                            0 && (
                                            <p className="text-xs text-muted-foreground">
                                              {JSON.stringify(step.config)}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  deleteMutation.mutate(workflow.id)
                                }
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete Workflow
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : workflow.id)
                        }
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="mr-2 h-4 w-4" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            View Details
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Workflow Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Sequence</DialogTitle>
            <DialogDescription>
              Set up an automated follow-up sequence for your leads.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wf-name">Workflow Name</Label>
                <Input
                  id="wf-name"
                  placeholder="e.g., New Lead Welcome Sequence"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select
                  value={form.watch("trigger_type")}
                  onValueChange={(val) => form.setValue("trigger_type", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.trigger_type && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.trigger_type.message}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Steps</Label>
                <span className="text-xs text-muted-foreground">
                  {fields.length} step{fields.length !== 1 ? "s" : ""}
                </span>
              </div>

              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No steps added yet. Add your first step below.
                </p>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => {
                  const stepType = form.watch(`steps.${index}.step_type`);
                  const StepIcon = getStepIcon(stepType);
                  return (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Step {index + 1}
                          </span>
                        </div>
                        <Select
                          value={stepType}
                          onValueChange={(val) =>
                            form.setValue(`steps.${index}.step_type`, val)
                          }
                        >
                          <SelectTrigger className="mt-1 h-8">
                            <SelectValue placeholder="Select step type" />
                          </SelectTrigger>
                          <SelectContent>
                            {STEP_TYPES.map((s) => {
                              const Icon = s.icon;
                              return (
                                <SelectItem key={s.value} value={s.value}>
                                  <span className="flex items-center gap-2">
                                    <Icon className="h-3.5 w-3.5" />
                                    {s.label}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => append({ step_type: "", config: {} })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>

              {form.formState.errors.steps && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.steps.message ||
                    form.formState.errors.steps.root?.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Sequence"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
