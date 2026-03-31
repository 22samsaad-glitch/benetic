"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { templates } from "@/lib/api";
import { MessageTemplate } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Mail, MessageSquare, Eye, EyeOff, Trash2, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const VARIABLES = [
  { key: "{{first_name}}", label: "First Name" },
  { key: "{{last_name}}", label: "Last Name" },
  { key: "{{email}}", label: "Email" },
  { key: "{{company_name}}", label: "Company" },
  { key: "{{score}}", label: "Score" },
];

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const { data: templatesList = [], isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: templates.list,
  });

  const createMutation = useMutation({
    mutationFn: () => templates.create({ name, channel, subject: channel === "email" ? subject : undefined, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template created");
      resetForm();
    },
    onError: () => toast.error("Failed to create template"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      templates.update(editingTemplate!.id, { name, channel, subject: channel === "email" ? subject : undefined, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template updated");
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: templates.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template deleted");
    },
  });

  const resetForm = () => {
    setName("");
    setChannel("email");
    setSubject("");
    setBody("");
    setCreateOpen(false);
    setEditingTemplate(null);
    setShowPreview(false);
  };

  const openEdit = (t: MessageTemplate) => {
    setEditingTemplate(t);
    setName(t.name);
    setChannel(t.channel);
    setSubject(t.subject || "");
    setBody(t.body);
    setCreateOpen(true);
  };

  const renderPreview = (text: string) =>
    text
      .replace(/\{\{first_name\}\}/g, "Jane")
      .replace(/\{\{last_name\}\}/g, "Smith")
      .replace(/\{\{email\}\}/g, "jane@example.com")
      .replace(/\{\{company_name\}\}/g, "Acme Inc")
      .replace(/\{\{score\}\}/g, "85");

  const insertVariable = (v: string) => setBody((prev) => prev + v);

  const emailTemplates = templatesList.filter((t: MessageTemplate) => t.channel === "email");
  const smsTemplates = templatesList.filter((t: MessageTemplate) => t.channel === "sms");

  const renderTemplateGrid = (list: MessageTemplate[]) =>
    list.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-base font-medium text-foreground mb-2">No templates yet</p>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-6">
          Templates are the messages your leads receive. Create your first template and attach it to a sequence — Jetleads will send it automatically when a new lead comes in.
        </p>
        <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Create your first template
        </Button>
      </div>
    ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {list.map((t) => (
            <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <Badge variant={t.channel === "email" ? "default" : "secondary"}>
                      {t.channel === "email" ? <Mail className="mr-1 h-3 w-3" /> : <MessageSquare className="mr-1 h-3 w-3" />}
                      {t.channel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {t.subject && (
                    <p className="text-sm font-medium text-muted-foreground truncate">
                      Subject: {t.subject}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-3">{t.body}</p>
                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                      <Edit2 className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(t.id)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <Button size="sm" onClick={() => { resetForm(); setCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Tabs defaultValue="email">
        <TabsList>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email ({emailTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="sms">
            <MessageSquare className="mr-2 h-4 w-4" />
            SMS ({smsTemplates.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="email" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : renderTemplateGrid(emailTemplates)}
        </TabsContent>
        <TabsContent value="sms" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : renderTemplateGrid(smsTemplates)}
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={resetForm}>
        <DialogContent className="max-w-2xl" hideClose>
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? "Update your message template" : "Create a new message template"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Welcome Email" />
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as "email" | "sms")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {channel === "email" && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Following up on your inquiry" />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Body</Label>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? <EyeOff className="mr-1 h-3.5 w-3.5" /> : <Eye className="mr-1 h-3.5 w-3.5" />}
                  {showPreview ? "Edit" : "Preview"}
                </Button>
              </div>
              {showPreview ? (
                <div className="rounded-xl border p-4 min-h-[120px] text-sm whitespace-pre-wrap">
                  {channel === "email" && subject && (
                    <p className="font-medium mb-2">{renderPreview(subject)}</p>
                  )}
                  {renderPreview(body)}
                </div>
              ) : (
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Hi {{first_name}}, ..."
                  className="min-h-[120px]"
                />
              )}
            </div>

            {!showPreview && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground mr-1 self-center">Insert:</span>
                {VARIABLES.map((v) => (
                  <Badge
                    key={v.key}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => insertVariable(v.key)}
                  >
                    {v.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button
              onClick={() => editingTemplate ? updateMutation.mutate() : createMutation.mutate()}
              disabled={!name || !body || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : editingTemplate ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
