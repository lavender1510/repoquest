import { Dashboard } from "@/components/dashboard";
import { getLatestDashboard } from "@/server/db/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  let initial = null;
  try { initial = await getLatestDashboard(); } catch (error) { console.warn("Database not initialized:", error); }
  return <Dashboard initialData={initial} />;
}
