import { cn } from "@/lib/utils";

interface JetleadsLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Show icon only (no wordmark) */
  iconOnly?: boolean;
}

export function JetleadsLogo({ size = "md", className, iconOnly = false }: JetleadsLogoProps) {
  const sizes = {
    sm: { icon: 18, text: "text-[15px]", gap: "gap-1.5" },
    md: { icon: 22, text: "text-[18px]", gap: "gap-2" },
    lg: { icon: 32, text: "text-[26px]", gap: "gap-3" },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex items-center", s.gap, className)}>
      {/* Lightning bolt icon */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z"
          fill="#2563eb"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Wordmark */}
      {!iconOnly && (
        <span
          className={cn("font-bold leading-none tracking-tight", s.text)}
          style={{ color: "#0f172a", fontFamily: "Inter, sans-serif" }}
        >
          Jetleads
        </span>
      )}
    </div>
  );
}
