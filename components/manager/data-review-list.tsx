"use client";

import React, { useEffect, useState } from "react";
import { fetchDataReviewList, DataReviewRecord } from "@/api/manager/data-review-api";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DataReviewList() {
  const { tenantId, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<DataReviewRecord[]>([]);

  useEffect(() => {
    if (!tenantId || !token) return;

    let mounted = true;
    setLoading(true);

    fetchDataReviewList({ tenantId, token, page: 1, limit: 50 })
      .then((res) => {
        if (!mounted) return;
        setRecords(res.documents || []);
      })
      .catch((err) => {
        console.error("Error fetching data-review:", err);
      })
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, [tenantId, token]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Data review requests</h2>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-auto rounded-md border">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Module</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Summary</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Created by</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Created at</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y">
              {records.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-2 text-sm text-gray-700">{r._id.slice(0, 8)}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{r.type?.[0] ?? "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{r.method?.[0] ?? "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{renderSummary(r)}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{r.created_by?.username ?? r.created_by?.email ?? "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-2 text-sm text-right">
                    <Badge>{r.status?.[0] ?? "-"}</Badge>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={7}>
                    No data-review requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function renderSummary(r: DataReviewRecord) {
  if (!r.data) return "-";
  // try common fields
  if (r.data.title) return String(r.data.title);
  if (r.data.name) return String(r.data.name);
  if (r.data._id) return String(r.data._id).slice(0, 8);
  // fallback to truncated JSON
  try {
    const s = JSON.stringify(r.data);
    return s.length > 60 ? s.slice(0, 60) + "..." : s;
  } catch {
    return "-";
  }
}

function formatDate(v?: string) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return v;
  }
}
