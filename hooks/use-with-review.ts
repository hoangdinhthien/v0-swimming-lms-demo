import { useToast } from "@/hooks/use-toast";
import { isDataReviewResponse } from "@/utils/review-utils";

interface UseWithReviewOptions {
  onSuccess?: (data?: any) => void;
  onReview?: (data?: any) => void;
}

export function useWithReview(hookOptions?: UseWithReviewOptions) {
  const { toast } = useToast();

  const handleResponse = (response: any, options?: UseWithReviewOptions) => {
    const finalOptions = { ...hookOptions, ...options };

    // Check for data-review message
    if (isDataReviewResponse(response)) {
      toast({
        title: "Thông báo",
        description: "Thông tin cần được quản lý phê duyệt",
        variant: "default",
        className: "bg-yellow-500 text-white border-none",
      });

      if (finalOptions?.onReview) {
        finalOptions.onReview(response);
      }

      // We generally consider review as "partial success" in terms of UI flow (e.g. redirecting)
      // BUT if the caller wants to STOP redirection, they should handle it in onReview.
      // If onSuccess is provided, we do NOT call it here, because it's not a "success" in the standard sense.
      // The caller is responsible for redirecting in onReview if they want to.
      return { isReview: true, data: response };
    }

    // Normal success
    if (finalOptions?.onSuccess) {
      finalOptions.onSuccess(response);
    }

    return { isReview: false, data: response };
  };

  return { handleResponse };
}
