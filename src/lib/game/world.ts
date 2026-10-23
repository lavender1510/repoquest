import type { CommitData, IssueData, QuestData, RegionData, RegionStatus, WorkflowData } from "@/types/dashboard";

export function getRegionKey(text: string, directories: string[]): string {
  const lower = text.toLowerCase().replaceAll("\\", "/");
  const matching = directories
    .filter((name) => new RegExp(`(^|[^a-z0-9_-])${escapeRegex(name.toLowerCase())}(/|\\b)`, "i").test(lower))
    .sort((a, b) => b.length - a.length);
  return matching[0] ?? "root";
}
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function calculateRegionHealth(open: QuestData[], failedCi: number, complexity: number): number {
  const bugs = open.filter((issue) => issue.kind === "monster").length;
  const other = open.length - bugs;
  return Math.max(0, Math.min(100, 100 - bugs * 18 - other * 7 - Math.min(failedCi, 4) * 9 - Math.floor(complexity / 18)));
}

export function regionStatus(health: number, open: QuestData[]): RegionStatus {
  if (health < 25 && open.some((q) => q.kind === "monster" && q.difficulty >= 4)) return "boss";
  if (health < 45) return "cursed";
  if (health < 75) return "damaged";
  return "healthy";
}

export function buildRegions(directories: string[], quests: QuestData[], commits: CommitData[], runs: WorkflowData[]): RegionData[] {
  const unique = [...new Set(["root", ...directories])].sort((a, b) => a === "root" ? -1 : b === "root" ? 1 : a.localeCompare(b));
  const recentFailureCount = runs.slice(0, 10).filter((run) => run.conclusion === "failure").length;
  return unique.map((key, index) => {
    const regionQuests = quests.filter((q) => q.regionKey === key && q.state === "open");
    const regionCommits = commits.filter((commit) => commit.paths.some((path) => key === "root" ? !path.includes("/") : path.split("/")[0] === key)).slice(0, 6);
    // Complexity is a transparent proxy for recent churn + unresolved tickets, not static analysis.
    const complexity = Math.min(100, 10 + regionQuests.length * 12 + regionCommits.length * 8);
    const health = calculateRegionHealth(regionQuests, key === "root" ? recentFailureCount : 0, complexity);
    const angle = index * 2.399963229728653;
    const distance = index === 0 ? 0 : 0.28 + 0.57 * Math.sqrt(index / Math.max(1, unique.length - 1));
    const x = 50 + Math.cos(angle) * distance * 39;
    const y = 50 + Math.sin(angle) * distance * 38;
    return {
      key, name: key === "root" ? "Zitadelle /" : `${key}/`, health, complexity,
      openIssues: regionQuests.length, status: regionStatus(health, regionQuests),
      questNumbers: regionQuests.map((q) => q.number), commits: regionCommits, x, y,
    };
  });
}

export function assignRegion(issue: IssueData, directories: string[]): string {
  return getRegionKey(`${issue.title} ${issue.body}`, directories);
}
