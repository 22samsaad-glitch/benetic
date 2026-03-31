"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leads, pipelines } from "@/lib/api";
import { Lead, Pipeline } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
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
import {
  Plus,
  Upload,
  Download,
  Search,
  Loader2,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "all",           label: "All Leads"     },
  { value: "pending",       label: "Pending"       },
  { value: "qualified",     label: "Qualified"     },
  { value: "disqualified",  label: "Disqualified"  },
  { value: "needs_review",  label: "Needs Review"  },
  { value: "in_sequence",   label: "In Sequence"   },
  { value: "responded",     label: "Responded"     },
  { value: "closed",        label: "Closed"        },
  { value: "unresponsive",  label: "Unresponsive"  },
];

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: leadsList = [], isLoading } = useQuery({
    queryKey: ["leads", search, sourceFilter],
    queryFn: () =>
      leads.list({
        search: search || undefined,
        source: sourceFilter !== "all" ? sourceFilter : undefined,
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

  // Client-side status filter (since backend doesn't yet filter by qualification_status)
  const filtered = statusFilter === "all"
    ? leadsList
    : leadsList.filter((l: Lead) => l.qualification_status === statusFilter);

  const sources = Array.from(new Set(leadsList.map((l: Lead) => l.source).filter(Boolean)));

  // Stat counts
  const total      = leadsList.length;
  const inSequence = leadsList.filter((l: Lead) => l.qualification_status === "in_sequence").length;
  const responded  = leadsList.filter((l: Lead) => l.qualification_status === "responded").length;
  const needsReview = leadsList.filter((l: Lead) => l.qualification_status === "needs_review").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">
            Welcome back, {user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Contact every lead in 5 minutes. Automatically.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Lead
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#2563eb] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-white/70" />
            <p className="text-[11px] font-semibold text-white/70 uppercase tracking-widest">Total Leads</p>
          </div>
          <p className="text-4xl font-bold text-white">{total}</p>
          <p className="text-xs text-white/50 mt-1">All time</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">In Sequence</p>
          </div>
          <p className="text-4xl font-bold text-gray-900">{inSequence}</p>
          <p className="text-xs text-gray-400 mt-1">Active follow-up</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-purple-400" />
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Responded</p>
          </div>
          <p className="text-4xl font-bold text-gray-900">{responded}</p>
          <p className="text-xs text-gray-400 mt-1">Replied to outreach</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-yellow-400" />
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Needs Review</p>
          </div>
          <p className="text-4xl font-bold text-gray-900">{needsReview}</p>
          <p className="text-xs text-gray-400 mt-1">Awaiting qualification</p>
        </div>
      </div>

      {/* Lead list */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Leads</h3>
            {total > 0 && (
              <span className="text-xs text-gray-400 font-normal">({filtered.length}{statusFilter !== "all" ? ` of ${total}` : ""})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" /> Import
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s} value={s!}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No leads yet</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              {search || sourceFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Connect a lead source and your first lead will appear here automatically"}
            </p>
            {!search && sourceFilter === "all" && statusFilter === "all" && (
              <div className="flex items-center gap-2 mt-5">
                <Button variant="outline" className="rounded-xl" onClick={() => window.location.href = "/integrations"}>
                  Connect a source
                </Button>
                <Button className="rounded-xl" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add manually
                </Button>
              </div>
            )}
          </div>
        ) : (
          <LeadTable
            leads={filtered}
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
                prev.size === filtered.length
                  ? new Set()
                  : new Set(filtered.map((l: Lead) => l.id))
              )
            }
            onEdit={(lead) => setSelectedLeadId(lead.id)}
            onDelete={(lead) => deleteMutation.mutate(lead.id)}
            onMoveStage={(lead, stageId) => moveStageMutation.mutate({ id: lead.id, stageId })}
            onRowClick={(lead) => setSelectedLeadId(lead.id)}
          />
        )}
      </div>

      <LeadForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => { queryClient.invalidateQueries({ queryKey: ["leads"] }); setCreateOpen(false); }}
      />
      <CsvImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => { queryClient.invalidateQueries({ queryKey: ["leads"] }); setImportOpen(false); }}
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
