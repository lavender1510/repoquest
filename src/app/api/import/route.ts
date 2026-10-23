import { NextRequest, NextResponse } from "next/server";
import { githubError } from "@/lib/github/client";
import { repositoryInputSchema } from "@/lib/github/validation";
import { importRepository } from "@/lib/github/importer";
import { createDashboard } from "@/lib/game/dashboard";
import { getLatestDashboard, storeDashboard } from "@/server/db/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inFlight = new Set<string>();
const lastImport = new Map<string, number>();
const cooldownMs = 20_000;

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 2048) return NextResponse.json({ error: "Anfrage ist zu groß." }, { status: 413 });
    const input = repositoryInputSchema.safeParse(await request.json());
    if (!input.success) return NextResponse.json({ error: "Bitte gültigen GitHub-Owner und Repository-Namen angeben." }, { status: 400 });
    const { owner, repo } = input.data;
    const key = `${owner}/${repo}`.toLowerCase();
    if (inFlight.has(key)) return NextResponse.json({ error: "Dieses Repository wird bereits synchronisiert." }, { status: 409 });
    if (Date.now() - (lastImport.get(key) ?? 0) < cooldownMs) return NextResponse.json({ error: "Bitte mindestens 20 Sekunden zwischen Importen warten." }, { status: 429 });
    inFlight.add(key);
    lastImport.set(key, Date.now());
    try {
      const previous = await getLatestDashboard(key);
      const imported = await importRepository(owner, repo);
      const dashboard = createDashboard(imported);
      await storeDashboard(dashboard);
      return NextResponse.json({ dashboard, levelUp: previous !== null && dashboard.agent.level > previous.agent.level, newAbility: dashboard.agent.abilities.at(-1) ?? null });
    } finally { inFlight.delete(key); }
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Ungültiges JSON." }, { status: 400 });
    if (error instanceof Error && /Prisma|database|SQLITE|P20\d{2}/.test(error.message)) {
      console.error("Database import failed:", error);
      return NextResponse.json({ error: "Datenbank nicht bereit. Führe npm run db:push aus." }, { status: 503 });
    }
    const failure = githubError(error);
    console.error("GitHub import failed:", failure.message);
    return NextResponse.json({ error: failure.message }, { status: failure.statusCode });
  }
}
