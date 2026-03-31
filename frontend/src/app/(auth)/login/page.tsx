"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!loading && user) {
      router.push("/leads");
    }
  }, [user, loading, router]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setApiError(null);
      await login(data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string | Array<{ msg: string }> } } };
      const detail = err.response?.data?.detail;
      const message = Array.isArray(detail)
        ? Array.from(new Set(detail.map((e) => e.msg))).join(". ")
        : detail || "Invalid email or password.";
      setApiError(message);
    }
  };

  if (loading || user) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
    <div className="w-full max-w-[440px] bg-white rounded-2xl border border-[#e2e8f0] px-10 py-9"
      style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z" fill="#2563eb" />
        </svg>
        <span className="text-xl font-bold text-[#0f172a] tracking-tight">Jetleads</span>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-[32px] font-bold text-[#0f172a] leading-tight mb-2">
          Welcome back
        </h1>
        <p className="text-base text-[#6b7280]">Sign in to your account</p>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {apiError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-[#374151]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            className="h-12 rounded-lg border-[#d1d5db] bg-white text-[#0f172a] placeholder:text-[#9ca3af] focus-visible:ring-[#2563eb] focus-visible:border-[#2563eb]"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-[13px] text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-[#374151]">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            className="h-12 rounded-lg border-[#d1d5db] bg-white text-[#0f172a] placeholder:text-[#9ca3af] focus-visible:ring-[#2563eb] focus-visible:border-[#2563eb]"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-[13px] text-red-500">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-[52px] rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] hover:-translate-y-0.5 active:translate-y-0 text-white text-base font-medium transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 mt-2"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-[#9ca3af] mt-7">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#2563eb] font-semibold hover:underline">
          Create one
        </Link>
      </p>
    </div>
    </div>
  );
}
