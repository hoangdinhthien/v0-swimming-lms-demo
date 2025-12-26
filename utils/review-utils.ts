export const isDataReviewResponse = (data: any): boolean => {
  if (!data) return false;

  if (Array.isArray(data)) {
    return data.some((item) => isDataReviewResponse(item));
  }

  if (typeof data === "object") {
    if (data.message === "data-review") {
      return true;
    }
    // Check 'data' field recursively
    if (data.data) {
      return isDataReviewResponse(data.data);
    }
  }

  return false;
};
