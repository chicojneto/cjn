import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeValue?: number;
  icon?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  showTrend?: boolean;
  delay?: number;
}

export function StatCard({
  label,
  value,
  change,
  changeValue = 0,
  icon,
  className,
  size = "md",
  showTrend = true,
  delay = 0,
}: StatCardProps) {
  const isPositive = changeValue > 0;
  const isNegative = changeValue < 0;

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  
  const sizeClasses = {
    sm: {
      container: "p-3",
      label: "text-[10px]",
      value: "text-lg",
      change: "text-[10px]",
      icon: "w-6 h-6",
    },
    md: {
      container: "p-4",
      label: "text-xs",
      value: "text-2xl",
      change: "text-xs",
      icon: "w-8 h-8",
    },
    lg: {
      container: "p-5",
      label: "text-sm",
      value: "text-3xl",
      change: "text-sm",
      icon: "w-10 h-10",
    },
  };

  const s = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm",
        "hover:border-border/60 hover:bg-card/70 transition-all duration-300",
        s.container,
        className
      )}
    >
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 opacity-0 transition-opacity duration-300",
        isPositive && "bg-card from-success/5 to-transparent group-hover:opacity-100",
        isNegative && "bg-card from-destructive/5 to-transparent group-hover:opacity-100"
      )} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className={cn(
            "font-medium text-muted-foreground uppercase tracking-wider mb-1",
            s.label
          )}>
            {label}
          </p>
          <p className={cn(
            "font-bold text-foreground tracking-tight tabular-nums",
            s.value
          )}>
            {value}
          </p>
          {change && showTrend && (
            <div className={cn(
              "flex items-center gap-1 mt-1 font-mono font-semibold",
              s.change,
              isPositive && "text-success",
              isNegative && "text-destructive",
              !isPositive && !isNegative && "text-muted-foreground"
            )}>
              <TrendIcon className="h-3 w-3" />
              <span>{change}</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={cn(
            "rounded-lg bg-primary/10 flex items-center justify-center text-primary",
            s.icon
          )}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
