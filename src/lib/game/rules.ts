import type {
  AgentData,
  DeploymentData,
  IssueData,
  PullRequestData,
  QuestData,
  QuestKind,
  WorkflowData,
} from "@/types/dashboard";

export const XP_PER_LEVEL = 100;
export const ABILITIES = ["Klingenfokus", "Runenschild", "Schattenanalyse", "Meister der Tests", "Portalwächter", "Architekt der Welten"];

export function getQuestKind(labels: string[]): QuestKind {
  const normalized = labels.map((label) => label.trim().toLowerCase());
  if (normalized.includes("good first issue")) return "tutorial";
  if (normalized.some((label) => label === "bug" || label.startsWith("bug:"))) return "monster";
  if (normalized.some((label) => ["enhancement", "feature"].includes(label))) return "build";
  if (normalized.some((label) => ["documentation", "docs"].includes(label))) return "research";
  return "explore";
}

export function getDifficulty(issue: IssueData): number {
  const labels = issue.labels.map((label) => label.toLowerCase());
  if (labels.includes("good first issue")) return 1;
  if (labels.some((label) => /critical|priority: high|security|p0/.test(label))) return 5;
  const score = 2 + Number(getQuestKind(labels) === "monster") + Number(issue.body.length > 700);
  return Math.min(5, score);
}

export function getQuestReward(difficulty: number, kind: QuestKind): number {
  return 15 + difficulty * 8 + (kind === "monster" ? 12 : 0);
}

export function linkedIssuesFromPr(pr: Pick<PullRequestData, "title" | "body">): number[] {
  // GitHub closing keywords: fixes, closes, resolves followed by #123 or owner/repo#123.
  const text = `${pr.title}\n${pr.body}`;
  const results = [...text.matchAll(/\b(?:fix(?:e[sd])?|close[sd]?|resolve[sd]?)\s+(?:[\w.-]+\/[\w.-]+)?#(\d+)\b/gi)];
  return [...new Set(results.map((result) => Number(result[1])))];
}

export function mapIssueToQuest(issue: IssueData, regionKey: string, pulls: PullRequestData[]): QuestData {
  const kind = getQuestKind(issue.labels);
  const difficulty = getDifficulty(issue);
  const winner = issue.state === "closed" ? pulls.find((pr) => pr.mergedAt && linkedIssuesFromPr(pr).includes(issue.number)) : undefined;
  return {
    ...issue,
    kind,
    difficulty,
    reward: getQuestReward(difficulty, kind),
    regionKey,
    completedByPr: winner?.number ?? null,
  };
}

export function calculateXp(issues: IssueData[], prs: PullRequestData[], runs: WorkflowData[], deployments: DeploymentData[]): number {
  const mergedPrs = new Map(prs.filter((pr) => Boolean(pr.mergedAt)).map((pr) => [pr.number, pr]));
  const closedIssues = new Set(issues.filter((issue) => issue.state === "closed").map((issue) => issue.number));
  const successRuns = new Set(runs.filter((run) => run.conclusion === "success").map((run) => run.id));
  const successDeployments = new Set(deployments.filter((d) => d.state === "success").map((d) => d.id));
  const bugPrCount = [...mergedPrs.values()].filter((pr) => pr.labels.some((label) => label.toLowerCase() === "bug")).length;
  return mergedPrs.size * 50 + closedIssues.size * 30 + bugPrCount * 80 + successRuns.size * 10 + successDeployments.size * 40;
}

export function levelFromXp(xp: number): number {
  return 1 + Math.floor(Math.max(0, xp) / XP_PER_LEVEL);
}

export function earnedAbilities(level: number): string[] {
  return Array.from({ length: Math.max(0, level - 1) }, (_, i) => ABILITIES[i % ABILITIES.length]);
}

export function buildAgent(issues: IssueData[], prs: PullRequestData[], runs: WorkflowData[], deployments: DeploymentData[]): AgentData {
  const xp = calculateXp(issues, prs, runs, deployments);
  const level = levelFromXp(xp);
  const failed = runs.filter((run) => run.conclusion === "failure").length;
  const failedDeployments = deployments.filter((d) => d.state === "failure").length;
  const merged = prs.filter((pr) => pr.mergedAt);
  return {
    name: "Lavinia",
    className: "Code-Wächterin",
    xp,
    level,
    hp: Math.max(10, 100 - failed * 9 - failedDeployments * 14),
    gold: merged.length * 25 + issues.filter((issue) => issue.state === "closed").length * 15,
    skills: {
      debugging: Math.min(99, 10 + merged.filter((pr) => pr.labels.some((label) => label.toLowerCase() === "bug")).length * 7),
      refactoring: Math.min(99, 12 + merged.length * 3),
      testing: Math.min(99, 10 + runs.filter((run) => run.conclusion === "success").length * 4),
      deployment: Math.min(99, 8 + deployments.filter((d) => d.state === "success").length * 10),
    },
    abilities: earnedAbilities(level),
  };
}
