import { useToast as useToastContext } from "@/components/ui/ToastProvider";
import type { ToastOptions, ToastType } from "@/lib/types/toast";

interface ToastHelpers {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  show: (type: ToastType, message: string, options?: ToastOptions) => void;
}

export function useToast(): ToastHelpers {
  const { showToast } = useToastContext();

  const show = (type: ToastType, message: string, options?: ToastOptions) => {
    showToast({
      type,
      message,
      title: options?.title,
      duration: options?.duration ?? 5000,
    });
  };

  return {
    success: (message: string, options?: ToastOptions) =>
      show("success", message, options),
    error: (message: string, options?: ToastOptions) =>
      show("error", message, options),
    warning: (message: string, options?: ToastOptions) =>
      show("warning", message, options),
    info: (message: string, options?: ToastOptions) =>
      show("info", message, options),
    show,
  };
}

// Re-export the raw context hook for advanced use cases
export { useToastContext };
