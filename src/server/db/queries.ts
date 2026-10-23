import type { DashboardData } from "@/types/dashboard";
import { linkedIssuesFromPr } from "@/lib/game/rules";
import { prisma } from "./client";

export async function getLatestDashboard(fullName?: string): Promise<DashboardData | null> {
  const snapshot = await prisma.snapshot.findFirst({
    where: fullName ? { repository: { fullName: fullName.toLowerCase() } } : undefined,
    orderBy: { createdAt: "desc" },
    select: { dashboardJson: true, repository: { select: { isPrivate: true } } },
  });
  // Without built-in login, production must not expose stored private repo snapshots by default.
  if (!snapshot || (snapshot.repository.isPrivate && process.env.NODE_ENV === "production" && process.env.ALLOW_PRIVATE_REPOS_IN_PRODUCTION !== "true")) return null;
  return JSON.parse(snapshot.dashboardJson) as DashboardData;
}

export async function storeDashboard(data: DashboardData): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const repository = await tx.repository.upsert({
      where: { fullName: data.repository.fullName.toLowerCase() },
      create: { owner: data.repository.owner, name: data.repository.name, fullName: data.repository.fullName.toLowerCase(), isPrivate: data.repository.isPrivate },
      update: { owner: data.repository.owner, name: data.repository.name, isPrivate: data.repository.isPrivate },
    });
    await tx.snapshot.create({
      data: {
        repositoryId: repository.id,
        createdAt: new Date(data.syncedAt),
        dashboardJson: JSON.stringify(data),
        agent: { create: { name: data.agent.name, className: data.agent.className, level: data.agent.level, xp: data.agent.xp, hp: data.agent.hp, gold: data.agent.gold, skillsJson: JSON.stringify(data.agent.skills) } },
        commits: { createMany: { data: data.commits.map((commit) => ({ sha: commit.sha, message: commit.message, author: commit.author, committedAt: new Date(commit.date), url: commit.url, pathsJson: JSON.stringify(commit.paths) })) } },
        issues: { createMany: { data: data.quests.map((quest) => ({ number: quest.number, title: quest.title, state: quest.state, labelsJson: JSON.stringify(quest.labels), createdAt: new Date(quest.createdAt), closedAt: quest.closedAt ? new Date(quest.closedAt) : null, url: quest.url, regionKey: quest.regionKey, questType: quest.kind, difficulty: quest.difficulty, reward: quest.reward, completedByPr: quest.completedByPr })) } },
        pullRequests: { createMany: { data: data.pulls.map((pr) => ({ number: pr.number, title: pr.title, state: pr.state, mergedAt: pr.mergedAt ? new Date(pr.mergedAt) : null, labelsJson: JSON.stringify(pr.labels), pathsJson: JSON.stringify(pr.paths), linkedJson: JSON.stringify(linkedIssuesFromPr(pr)), url: pr.url })) } },
        runs: { createMany: { data: data.workflows.map((run) => ({ runId: BigInt(run.id), name: run.name, status: run.status, conclusion: run.conclusion, createdAt: new Date(run.createdAt), url: run.url })) } },
        deployments: { createMany: { data: data.deployments.map((deployment) => ({ deployId: BigInt(deployment.id), environment: deployment.environment, state: deployment.state, createdAt: new Date(deployment.createdAt), url: deployment.url })) } },
        regions: { createMany: { data: data.regions.map((region) => ({ key: region.key, name: region.name, health: region.health, complexity: region.complexity, openIssues: region.openIssues, status: region.status })) } },
        events: { createMany: { data: data.chronicle.map((event) => ({ eventKey: event.key, kind: event.kind, text: event.text, occurredAt: new Date(event.occurredAt), url: event.url ?? null })) } },
      },
    });
    const snapshots = await tx.snapshot.findMany({ where: { repositoryId: repository.id }, orderBy: { createdAt: "desc" }, select: { id: true }, skip: 5 });
    if (snapshots.length) await tx.snapshot.deleteMany({ where: { id: { in: snapshots.map((item) => item.id) } } });
  }, { timeout: 30000 });
}
