"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { leads } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Lead } from "@/types";

const leadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  source: z.string().optional(),
  custom_fields: z.array(
    z.object({
      key: z.string().min(1, "Key is required"),
      value: z.string().min(1, "Value is required"),
    })
  ).optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

const SOURCES = ["website", "referral", "social", "email", "ads", "organic", "direct", "other"];

interface LeadFormProps {
  lead?: Lead;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LeadForm({ lead, open, onClose, onSuccess }: LeadFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!lead;

  const defaultCustomFields = lead?.custom_fields
    ? Object.entries(lead.custom_fields).map(([key, value]) => ({ key, value: String(value) }))
    : [];

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      source: "",
      custom_fields: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "custom_fields",
  });

  // Reset form when lead prop changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        first_name: lead?.first_name || "",
        last_name: lead?.last_name || "",
        email: lead?.email || "",
        phone: lead?.phone || "",
        source: lead?.source || "",
        custom_fields: defaultCustomFields,
      });
    }
  }, [open, lead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const createMutation = useMutation({
    mutationFn: (data: LeadFormValues) => {
      const customFields: Record<string, unknown> = {};
      data.custom_fields?.forEach((cf) => {
        customFields[cf.key] = cf.value;
      });
      return leads.create({
        first_name: data.first_name,
        last_name: data.last_name || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        source: data.source || undefined,
        custom_fields: Object.keys(customFields).length > 0 ? customFields : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead created successfully");
      onSuccess();
      onClose();
    },
    onError: () => toast.error("Failed to create lead"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: LeadFormValues) => {
      const customFields: Record<string, unknown> = {};
      data.custom_fields?.forEach((cf) => {
        customFields[cf.key] = cf.value;
      });
      return leads.update(lead!.id, {
        first_name: data.first_name,
        last_name: data.last_name || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        source: data.source || undefined,
        custom_fields: Object.keys(customFields).length > 0 ? customFields : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead", lead!.id] });
      toast.success("Lead updated successfully");
      onSuccess();
      onClose();
    },
    onError: () => toast.error("Failed to update lead"),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  function onSubmit(data: LeadFormValues) {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the lead's information below."
              : "Fill in the details to create a new lead."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                placeholder="John"
                {...form.register("first_name")}
              />
              {form.formState.errors.first_name && (
                <p className="text-xs text-red-500">{form.formState.errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                placeholder="Doe"
                {...form.register("last_name")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              {...form.register("phone")}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Source</Label>
            <Select
              value={form.watch("source") || ""}
              onValueChange={(val) => form.setValue("source", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((src) => (
                  <SelectItem key={src} value={src}>
                    {src.charAt(0).toUpperCase() + src.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Fields */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Custom Fields</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => append({ key: "", value: "" })}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Field
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  placeholder="Key"
                  className="flex-1"
                  {...form.register(`custom_fields.${index}.key`)}
                />
                <Input
                  placeholder="Value"
                  className="flex-1"
                  {...form.register(`custom_fields.${index}.value`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-red-500 hover:text-red-600"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {fields.length > 0 && form.formState.errors.custom_fields && (
              <p className="text-xs text-red-500">All custom field keys and values are required</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
