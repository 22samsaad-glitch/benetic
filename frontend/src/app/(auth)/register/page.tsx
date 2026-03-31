"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const registerSchema = z
  .object({
    business_name: z.string().min(1, "Company name is required"),
    owner_name: z.string().min(1, "Full name is required"),
    owner_email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-400" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-400" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-400" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

export default function RegisterPage() {
  const { user, loading, register: registerUser } = useAuth();
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch("password", "");
  const businessName = watch("business_name", "");
  const strength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);
  const slug = useMemo(() => generateSlug(businessName), [businessName]);

  useEffect(() => {
    if (!loading && user) {
      router.push("/setup");
    }
  }, [user, loading, router]);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setApiError(null);
      await registerUser({
        business_name: data.business_name,
        slug: generateSlug(data.business_name),
        owner_name: data.owner_name,
        owner_email: data.owner_email,
        password: data.password,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string | Array<{ msg: string }> } } };
      if (!err.response) {
        setApiError("Cannot reach the server. Make sure the backend is running on port 8000.");
        return;
      }
      const detail = err.response.data?.detail;
      let message: string;
      if (Array.isArray(detail)) {
        message = Array.from(new Set(detail.map((e) => e.msg))).join(". ");
      } else {
        message = detail || "Registration failed. Please try again.";
      }
      setApiError(message);
    }
  };

  if (loading || user) return null;

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_4px_24px_rgba(0,0,0,0.08)] px-12 py-10">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z" fill="#2563eb" />
          </svg>
          <span className="text-[#0f172a] font-bold text-lg tracking-tight">Jetleads</span>
        </div>

        {/* Heading */}
        <div className="mb-7">
          <h1 className="text-[26px] font-bold text-[#0f172a] leading-tight tracking-tight">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-[#6b7280]">Set up automated follow-ups in 5 minutes</p>
        </div>

        {/* API error */}
        {apiError && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {apiError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="owner_name" className="text-sm font-medium text-[#374151]">
              Full Name
            </Label>
            <Input
              id="owner_name"
              type="text"
              placeholder="Jane Smith"
              autoComplete="name"
              className="h-12 rounded-lg border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#9ca3af] focus-visible:ring-[#2563eb] focus-visible:border-[#2563eb]"
              {...register("owner_name")}
            />
            {errors.owner_name && (
              <p className="text-xs text-red-500">{errors.owner_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="owner_email" className="text-sm font-medium text-[#374151]">
              Email
            </Label>
            <Input
              id="owner_email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              className="h-12 rounded-lg border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#9ca3af] focus-visible:ring-[#2563eb] focus-visible:border-[#2563eb]"
              {...register("owner_email")}
            />
            {errors.owner_email && (
              <p className="text-xs text-red-500">{errors.owner_email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="business_name" className="text-sm font-medium text-[#374151]">
              Company Name
            </Label>
            <Input
              id="business_name"
              type="text"
              placeholder="Acme Inc."
              className="h-12 rounded-lg border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#9ca3af] focus-visible:ring-[#2563eb] focus-visible:border-[#2563eb]"
              {...register("business_name")}
            />
            {slug && (
              <p className="text-xs text-[#9ca3af]">
                Workspace: <span className="font-mono text-[#6b7280]">{slug}</span>
              </p>
            )}
            {errors.business_name && (
              <p className="text-xs text-red-500">{errors.business_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-[#374151]">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="h-12 rounded-lg border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#9ca3af] focus-visible:ring-[#2563eb] focus-visible:border-[#2563eb]"
              {...register("password")}
            />
            {passwordValue.length > 0 && (
              <div className="space-y-1 pt-0.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                        level <= strength.score ? strength.color : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#9ca3af]">{strength.label}</p>
              </div>
            )}
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#374151]">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className="h-12 rounded-lg border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#9ca3af] focus-visible:ring-[#2563eb] focus-visible:border-[#2563eb]"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[52px] rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] hover:-translate-y-px active:translate-y-0 text-white text-[15px] font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 mt-1"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-[#9ca3af] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#2563eb] font-medium hover:underline">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
