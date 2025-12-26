const isDataReviewResponse = (data) => {
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

const mockResponse = {
  data: [
    [
      {
        message: "data-review",
        data: {
          acknowledged: true,
          insertedId: "694df57401514d183c02c35e",
        },
      },
    ],
  ],
  message: "Success",
  statusCode: 201,
};

console.log("Mock Response Check:", isDataReviewResponse(mockResponse));
