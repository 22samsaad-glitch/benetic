"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Pencil,
  ArrowRightLeft,
  Trash2,
} from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Lead, PipelineStage } from "@/types";

type SortField = "name" | "email" | "source" | "created_at";
type SortDir = "asc" | "desc";

interface LeadTableProps {
  leads: Lead[];
  stages: PipelineStage[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onMoveStage: (lead: Lead, stageId: string) => void;
  onRowClick: (lead: Lead) => void;
}

function getScoreColor(score: number) {
  if (score <= 30) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (score <= 60) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
}

const SOURCE_COLORS: Record<string, string> = {
  website: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  referral: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  social: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  email: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  ads: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  organic: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  direct: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

function getSourceColor(source: string | null) {
  if (!source) return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  return SOURCE_COLORS[source.toLowerCase()] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
}

function getLeadName(lead: Lead) {
  const parts = [lead.first_name, lead.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Unnamed";
}

export default function LeadTable({
  leads,
  stages,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onMoveStage,
  onRowClick,
}: LeadTableProps) {
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sorted = [...leads].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "name":
        cmp = getLeadName(a).localeCompare(getLeadName(b));
        break;
      case "email":
        cmp = (a.email || "").localeCompare(b.email || "");
        break;
      case "source":
        cmp = (a.source || "").localeCompare(b.source || "");
        break;
      case "created_at":
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5" />
    );
  }

  function getStageName(stageId: string | null) {
    if (!stageId) return null;
    return stages.find((s) => s.id === stageId)?.name || null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/50">
              <th className="w-10 px-3 py-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onToggleSelectAll}
                  aria-label="Select all leads"
                />
              </th>
              <th className="px-3 py-3 text-left">
                <button onClick={() => handleSort("name")} className="inline-flex items-center font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                  Name <SortIcon field="name" />
                </button>
              </th>
              <th className="px-3 py-3 text-left">
                <button onClick={() => handleSort("email")} className="inline-flex items-center font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                  Email <SortIcon field="email" />
                </button>
              </th>
              <th className="hidden px-3 py-3 text-left md:table-cell">
                <span className="font-medium text-gray-600 dark:text-gray-400">Phone</span>
              </th>
              <th className="px-3 py-3 text-left">
                <button onClick={() => handleSort("source")} className="inline-flex items-center font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                  Source <SortIcon field="source" />
                </button>
              </th>
              <th className="hidden px-3 py-3 text-left lg:table-cell">
                <span className="font-medium text-gray-600 dark:text-gray-400">Stage</span>
              </th>
              <th className="hidden px-3 py-3 text-left lg:table-cell">
                <button onClick={() => handleSort("created_at")} className="inline-flex items-center font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                  Created <SortIcon field="created_at" />
                </button>
              </th>
              <th className="w-24 px-3 py-3 text-right">
                <span className="font-medium text-gray-600 dark:text-gray-400">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((lead, i) => {
              const name = getLeadName(lead);
              const stageName = getStageName(lead.stage_id);
              const isHovered = hoveredRow === lead.id;
              const isSelected = selectedIds.has(lead.id);

              return (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.2 }}
                  className={cn(
                    "cursor-pointer border-b border-gray-100 transition-colors dark:border-gray-800/50",
                    isSelected
                      ? "bg-blue-50/60 dark:bg-blue-900/10"
                      : "hover:bg-gray-50 dark:hover:bg-gray-900/30"
                  )}
                  onMouseEnter={() => setHoveredRow(lead.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onRowClick(lead)}
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelect(lead.id)}
                      aria-label={`Select ${name}`}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-[11px] font-semibold text-white">
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                    {lead.email || "\u2014"}
                  </td>
                  <td className="hidden px-3 py-3 text-gray-600 md:table-cell dark:text-gray-400">
                    {lead.phone || "\u2014"}
                  </td>
                  <td className="px-3 py-3">
                    {lead.source ? (
                      <Badge variant="secondary" className={cn("text-xs font-medium", getSourceColor(lead.source))}>
                        {lead.source}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">\u2014</span>
                    )}
                  </td>
                  <td className="hidden px-3 py-3 lg:table-cell">
                    {stageName ? (
                      <Badge variant="outline" className="text-xs">
                        {stageName}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">\u2014</span>
                    )}
                  </td>
                  <td className="hidden px-3 py-3 text-gray-500 lg:table-cell dark:text-gray-400">
                    {formatDate(lead.created_at)}
                  </td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className={cn("flex items-center justify-end gap-1 transition-opacity", isHovered ? "opacity-100" : "opacity-0")}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(lead)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>

                      {stages.length > 0 && (
                        <Select onValueChange={(val) => onMoveStage(lead, val)}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SelectTrigger className="h-7 w-7 border-0 bg-transparent p-0 shadow-none [&>svg:last-child]:hidden">
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                              </SelectTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Move stage</TooltipContent>
                          </Tooltip>
                          <SelectContent>
                            {stages.map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>
                                {stage.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                            onClick={() => onDelete(lead)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}
