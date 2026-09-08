import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "rounded-xl border transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card/60 border-border/50 backdrop-blur-sm",
        elevated: "bg-card/80 border-border/40 backdrop-blur-xl shadow-elevated",
        glass: "bg-card/40 border-border/30 backdrop-blur-lg",
        outline: "bg-transparent border-border/50",
        glow: "bg-card/60 border-primary/30  backdrop-blur-sm",
      },
      interactive: {
        true: "hover:border-primary/40 hover:shadow-soft hover:-translate-y-0.5 cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      interactive: false,
    },
  }
);

interface ModernCardProps
  extends Omit<HTMLMotionProps<"div">, "onDrag" | "onDragStart" | "onDragEnd">,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode;
}

const ModernCard = React.forwardRef<HTMLDivElement, ModernCardProps>(
  ({ className, variant, interactive, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(cardVariants({ variant, interactive, className }))}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
ModernCard.displayName = "ModernCard";

interface ModernCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

const ModernCardHeader = React.forwardRef<HTMLDivElement, ModernCardHeaderProps>(
  ({ className, icon, action, badge, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between p-4 border-b border-border/30",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div className="flex items-center gap-2">
          {children}
          {badge}
        </div>
      </div>
      {action}
    </div>
  )
);
ModernCardHeader.displayName = "ModernCardHeader";

const ModernCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
ModernCardTitle.displayName = "ModernCardTitle";

const ModernCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-muted-foreground", className)}
    {...props}
  />
));
ModernCardDescription.displayName = "ModernCardDescription";

const ModernCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
));
ModernCardContent.displayName = "ModernCardContent";

const ModernCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-4 pt-0 border-t border-border/30",
      className
    )}
    {...props}
  />
));
ModernCardFooter.displayName = "ModernCardFooter";

export {
  ModernCard,
  ModernCardHeader,
  ModernCardFooter,
  ModernCardTitle,
  ModernCardDescription,
  ModernCardContent,
};
