"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

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

  if (score <= 1) return { score, label: "Weak", color: "bg-destructive" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
  return { score, label: "Strong", color: "bg-green-500" };
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
      // New users go to setup, returning users go to leads
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
      const err = error as { response?: { data?: { detail?: string | Array<{msg: string}> } } };
      const detail = err.response?.data?.detail;
      let message: string;
      if (Array.isArray(detail)) {
        const uniqueMsgs = Array.from(new Set(detail.map((e) => e.msg)));
        message = uniqueMsgs.join(". ");
      } else {
        message = detail || "Registration failed. Please try again.";
      }
      setApiError(message);
    }
  };

  if (loading || user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Never lose a lead to slow follow-up</CardTitle>
          <CardDescription>Set up automated follow-up in 5 minutes</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {apiError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              >
                {apiError}
              </motion.div>
            )}
            <div className="space-y-2">
              <Label htmlFor="business_name">Company Name</Label>
              <Input
                id="business_name"
                type="text"
                placeholder="Acme Inc."
                {...register("business_name")}
              />
              {slug && (
                <p className="text-xs text-muted-foreground">
                  Your workspace URL: <span className="font-mono">{slug}</span>
                </p>
              )}
              {errors.business_name && (
                <p className="text-sm text-destructive">{errors.business_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_name">Full Name</Label>
              <Input
                id="owner_name"
                type="text"
                placeholder="Jane Smith"
                autoComplete="name"
                {...register("owner_name")}
              />
              {errors.owner_name && (
                <p className="text-sm text-destructive">{errors.owner_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_email">Email</Label>
              <Input
                id="owner_email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                {...register("owner_email")}
              />
              {errors.owner_email && (
                <p className="text-sm text-destructive">{errors.owner_email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                {...register("password")}
              />
              {passwordValue.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          level <= strength.score ? strength.color : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{strength.label}</p>
                </div>
              )}
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
