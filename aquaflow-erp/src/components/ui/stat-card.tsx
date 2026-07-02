import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCardSkeleton } from "@/components/ui/loading-skeleton";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  isLoading?: boolean;
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor,
  isLoading = false,
  subtitle,
}: StatCardProps) {
  if (isLoading) return <StatCardSkeleton />;

  const TrendIcon =
    changeType === "positive"
      ? TrendingUp
      : changeType === "negative"
      ? TrendingDown
      : Minus;

  return (
    <div className="bg-surface rounded-xl border border-border p-5 shadow-card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-display font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-1.5 text-2xl font-display font-bold text-foreground leading-tight">
            {value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground/70">{subtitle}</p>
          )}
          {change && (
            <div
              className={cn(
                "mt-1.5 flex items-center gap-1 text-xs font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              <TrendIcon className="w-3 h-3 shrink-0" />
              <span>{change}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ml-3",
            iconColor ?? "bg-brand-light"
          )}
        >
          <Icon className={cn("w-5 h-5", iconColor ? "text-current" : "text-brand")} />
        </div>
      </div>
    </div>
  );
}
