// This is a simplified version of the use-toast hook
// You should use the one provided by shadcn/ui when you install the toast component

import * as React from "react";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
};

type Toast = ToastProps & {
  id: string;
};

const ToastContext = React.createContext<{
  toasts: Toast[];
  toast: (props: ToastProps) => void;
  dismiss: (id: string) => void;
}>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

let toastCount = 0;

export function useToast() {
  const context = React.useContext(ToastContext);

  if (!context) {
    // Return a mock implementation if context is not available
    return {
      toast: (props: ToastProps) => {
        console.log("Toast:", props);
      },
      toasts: [],
      dismiss: () => {},
    };
  }

  return context;
}
