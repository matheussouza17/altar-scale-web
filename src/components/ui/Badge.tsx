import { cn } from "@/lib/utils";

type Variant = "green" | "blue" | "gray" | "yellow" | "red";

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<Variant, string> = {
  green: "bg-green-100 text-green-800",
  blue: "bg-blue-100 text-blue-800",
  gray: "bg-gray-100 text-gray-600",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-700",
};

export function Badge({ variant = "gray", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
