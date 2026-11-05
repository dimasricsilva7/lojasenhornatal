import DashboardClient from "./DashboardClient";
import OnlineNow from "@/components/OnlineNow";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <OnlineNow />
      <DashboardClient />
    </div>
  );
}
