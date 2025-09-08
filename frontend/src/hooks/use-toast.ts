// Updated to use Sonner instead of shadcn/ui toast
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
};

export function useToast() {
  const toast = ({
    title,
    description,
    variant = "default",
    duration,
  }: ToastProps) => {
    const message = title || description || "";
    const fullMessage =
      title && description ? `${title}: ${description}` : message;

    switch (variant) {
      case "destructive":
        sonnerToast.error(fullMessage, { duration });
        break;
      case "success":
        sonnerToast.success(fullMessage, { duration });
        break;
      default:
        sonnerToast(fullMessage, { duration });
        break;
    }
  };

  return {
    toast,
    // These are kept for compatibility but don't have direct equivalents in Sonner
    toasts: [],
    dismiss: () => {
      sonnerToast.dismiss();
    },
  };
}
