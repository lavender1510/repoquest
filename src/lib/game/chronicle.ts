import type { ChronicleEventData, CommitData, DeploymentData, QuestData, PullRequestData, WorkflowData } from "@/types/dashboard";

export function buildChronicle(quests: QuestData[], prs: PullRequestData[], runs: WorkflowData[], deployments: DeploymentData[], commits: CommitData[]): ChronicleEventData[] {
  const events: ChronicleEventData[] = [];
  for (const quest of quests) {
    if (quest.state === "open") events.push({ key: `issue-${quest.number}`, kind: "issue", text: quest.kind === "monster" ? `Ein wilder Bug erscheint in ${quest.regionKey}/ — #${quest.number}` : `Neue Quest entdeckt: #${quest.number} ${quest.title}`, occurredAt: quest.createdAt, url: quest.url });
    if (quest.completedByPr && quest.closedAt) events.push({ key: `issue-closed-${quest.number}`, kind: "victory", text: `Lavinia besiegt Quest #${quest.number} durch PR #${quest.completedByPr} (+30 XP)`, occurredAt: quest.closedAt, url: quest.url });
  }
  for (const pr of prs) if (pr.mergedAt) events.push({ key: `merge-${pr.number}`, kind: "victory", text: `PR #${pr.number} wurde verschmolzen (+${pr.labels.some((label) => label.toLowerCase() === "bug") ? 130 : 50} XP)`, occurredAt: pr.mergedAt, url: pr.url });
  for (const run of runs) if (run.conclusion === "success" || run.conclusion === "failure") events.push({ key: `ci-${run.id}`, kind: "ci", text: run.conclusion === "success" ? `Test-Wache „${run.name}“ siegt (+10 XP)` : `Die Test-Wache „${run.name}“ wurde beschädigt`, occurredAt: run.createdAt, url: run.url });
  for (const deploy of deployments) if (["success", "failure"].includes(deploy.state)) events.push({ key: `deployment-${deploy.id}`, kind: "deployment", text: deploy.state === "success" ? `Portal geöffnet: ${deploy.environment} erfolgreich ausgerollt (+40 XP)` : `Portal instabil: Deployment in ${deploy.environment} fehlgeschlagen`, occurredAt: deploy.createdAt, url: deploy.url });
  for (const commit of commits.slice(0, 15)) events.push({ key: `commit-${commit.sha}`, kind: "commit", text: `Schriftrolle aktualisiert: ${commit.message.split("\n")[0].slice(0, 100)}`, occurredAt: commit.date, url: commit.url });
  return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 100);
}
