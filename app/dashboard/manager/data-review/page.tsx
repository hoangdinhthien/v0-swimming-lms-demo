"use client";

import React from "react";
import DataReviewList from "@/components/manager/data-review-list";

export default function ManagerDataReviewPage() {
  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Data Review</h1>
        <p className="text-sm text-muted-foreground">Danh sách các request do staff gửi cần manager phê duyệt (chỉ xem, không phê duyệt ở giai đoạn này).</p>
      </header>

      <main>
        <DataReviewList />
      </main>
    </div>
  );
}
