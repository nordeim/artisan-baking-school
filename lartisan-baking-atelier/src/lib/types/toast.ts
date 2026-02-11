export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  createdAt: number;
}

export interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id" | "createdAt">) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

export interface ToastOptions {
  title?: string;
  duration?: number;
}
