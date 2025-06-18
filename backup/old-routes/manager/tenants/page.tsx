"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DeprecatedTenantsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/manager/applications");
  }, [router]);
  return <div>Đang chuyển hướng...</div>;
}
