import { redirect } from "next/navigation";

export default function DashboardRedirect() {
  // Server-side redirect to manager dashboard
  redirect("/dashboard/manager");
}
