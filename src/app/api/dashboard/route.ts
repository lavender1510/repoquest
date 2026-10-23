import { NextRequest, NextResponse } from "next/server";
import { repositoryInputSchema } from "@/lib/github/validation";
import { getLatestDashboard } from "@/server/db/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const hasRepository = query.has("owner") || query.has("repo");
  const parsed = hasRepository ? repositoryInputSchema.safeParse({ owner: query.get("owner"), repo: query.get("repo") }) : null;
  if (parsed && !parsed.success) return NextResponse.json({ error: "Ungültiges Repository." }, { status: 400 });
  try {
    const fullName = parsed?.success ? `${parsed.data.owner}/${parsed.data.repo}` : undefined;
    const dashboard = await getLatestDashboard(fullName);
    return NextResponse.json({ dashboard }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Dashboard read failed:", error);
    return NextResponse.json({ error: "Snapshot kann nicht gelesen werden. Prüfe die Datenbank." }, { status: 503 });
  }
}
