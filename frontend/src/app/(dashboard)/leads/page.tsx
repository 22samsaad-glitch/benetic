"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leads, pipelines } from "@/lib/api";
import { Lead, Pipeline } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LeadTable from "@/components/leads/LeadTable";
import LeadForm from "@/components/leads/LeadForm";
import LeadDetail from "@/components/leads/LeadDetail";
import { CsvImport } from "@/components/leads/CsvImport";
import { Plus, Upload, Download, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: leadsList = [], isLoading } = useQuery({
    queryKey: ["leads", search, sourceFilter, stageFilter],
    queryFn: () =>
      leads.list({
        search: search || undefined,
        source: sourceFilter !== "all" ? sourceFilter : undefined,
        stage_id: stageFilter !== "all" ? stageFilter : undefined,
      }),
  });

  const { data: pipelinesList = [] } = useQuery({
    queryKey: ["pipelines"],
    queryFn: pipelines.list,
  });

  const stages = pipelinesList.flatMap((p: Pipeline) => p.stages || []);

  const deleteMutation = useMutation({
    mutationFn: leads.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead deleted");
    },
  });

  const moveStageMutation = useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) =>
      leads.moveStage(id, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead moved");
    },
  });

  const handleExport = async () => {
    try {
      const blob = await leads.exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads-export.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Leads exported");
    } catch {
      toast.error("Export failed");
    }
  };

  const sources = Array.from(new Set(leadsList.map((l: Lead) => l.source).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <Badge variant="secondary">{leadsList.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s} value={s!}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : leadsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No leads found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {search || sourceFilter !== "all" || stageFilter !== "all"
              ? "Try adjusting your filters"
              : "Send yourself a test lead to see the magic"}
          </p>
          {!search && sourceFilter === "all" && stageFilter === "all" && (
            <div className="flex items-center gap-2 mt-4">
              <Button variant="outline" onClick={() => window.location.href = "/integrations"}>
                Get Webhook URL
              </Button>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Manually
              </Button>
            </div>
          )}
        </div>
      ) : (
        <LeadTable
          leads={leadsList}
          stages={stages}
          selectedIds={selectedIds}
          onToggleSelect={(id) =>
            setSelectedIds((prev) => {
              const next = new Set(prev);
              next.has(id) ? next.delete(id) : next.add(id);
              return next;
            })
          }
          onToggleSelectAll={() =>
            setSelectedIds((prev) =>
              prev.size === leadsList.length
                ? new Set()
                : new Set(leadsList.map((l: Lead) => l.id))
            )
          }
          onEdit={(lead) => setSelectedLeadId(lead.id)}
          onDelete={(lead) => deleteMutation.mutate(lead.id)}
          onMoveStage={(lead, stageId) =>
            moveStageMutation.mutate({ id: lead.id, stageId })
          }
          onRowClick={(lead) => setSelectedLeadId(lead.id)}
        />
      )}

      <LeadForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
          setCreateOpen(false);
        }}
      />

      <CsvImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
          setImportOpen(false);
        }}
      />

      {selectedLeadId && (
        <LeadDetail
          leadId={selectedLeadId}
          open={!!selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </div>
  );
}
