import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default function DashboardRedirect() {
  // Server-side redirect based on user role
  // For this demo version, we're directly redirecting to manager dashboard
  redirect("/dashboard/manager");
}
