"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToastType } from "@/lib/types/toast";

interface ToastProps {
  type: ToastType;
  title?: string;
  message: string;
  onDismiss?: () => void;
  duration?: number;
}

const toastIcons: Record<
  ToastType,
  React.ComponentType<{ className?: string }>
> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles: Record<ToastType, string> = {
  success: "bg-slate-900/95 border-champagne text-champagne",
  error: "bg-slate-900/95 border-aurora-magenta text-aurora-magenta",
  warning: "bg-slate-900/95 border-amber-500 text-amber-500",
  info: "bg-slate-900/95 border-aurora-cyan text-aurora-cyan",
};

export function Toast({
  type,
  title,
  message,
  onDismiss,
  duration = 5000,
}: ToastProps) {
  const Icon = toastIcons[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm shadow-lg",
        toastStyles[type],
      )}
      role="alert"
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-medium text-sm mb-1 text-slate-100">{title}</h4>
        )}
        <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-md hover:bg-slate-800/50 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800/50 rounded-b-lg overflow-hidden">
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: duration / 1000, ease: "linear" }}
          className="h-full bg-current opacity-50"
        />
      </div>
    </motion.div>
  );
}

// Export icon mapping for use in other components
export { toastIcons, toastStyles };
