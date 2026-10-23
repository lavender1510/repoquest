import type { DashboardData, QuestData } from "@/types/dashboard";
import type { ImportedRepository } from "@/lib/github/importer";
import { buildAgent, mapIssueToQuest } from "./rules";
import { assignRegion, buildRegions, getRegionKey } from "./world";
import { buildChronicle } from "./chronicle";

export function createDashboard(data: ImportedRepository, now = new Date()): DashboardData {
  const quests: QuestData[] = data.issues.map((issue) => mapIssueToQuest(issue, assignRegion(issue, data.directories), data.pulls));
  const commits = data.commits.map((commit) => ({
    ...commit,
    // Associate commits without detailed filenames with the root region.
    paths: commit.paths.length ? commit.paths : [getRegionKey(commit.message, data.directories) === "root" ? "README.md" : `${getRegionKey(commit.message, data.directories)}/unknown`],
  }));
  return {
    repository: data.repository,
    agent: buildAgent(data.issues, data.pulls, data.workflows, data.deployments),
    regions: buildRegions(data.directories, quests, commits, data.workflows),
    quests: quests.sort((a, b) => Number(a.state === "open") === Number(b.state === "open") ? b.createdAt.localeCompare(a.createdAt) : Number(b.state === "open") - Number(a.state === "open")),
    commits, pulls: data.pulls, workflows: data.workflows, deployments: data.deployments,
    chronicle: buildChronicle(quests, data.pulls, data.workflows, data.deployments, data.commits),
    syncedAt: now.toISOString(), warnings: data.warnings,
  };
}
