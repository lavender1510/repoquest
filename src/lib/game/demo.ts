import type { DashboardData, QuestData } from "@/types/dashboard";
import { buildAgent } from "./rules";
import { buildRegions } from "./world";
import { buildChronicle } from "./chronicle";

const base = new Date("2026-10-20T14:00:00Z");
const daysAgo = (days: number) => new Date(base.getTime() - days * 86400000).toISOString();
const issue = (number: number, title: string, labels: string[], regionKey: string, ago: number, state: "open" | "closed" = "open"): QuestData => ({
  number, title, body: `Betroffen: ${regionKey}/`, labels, state, createdAt: daysAgo(ago), closedAt: state === "closed" ? daysAgo(1) : null,
  url: `https://github.com/octocat/Hello-World/issues/${number}`, kind: labels.includes("bug") ? "monster" : labels.includes("enhancement") ? "build" : labels.includes("documentation") ? "research" : labels.includes("good first issue") ? "tutorial" : "explore",
  difficulty: labels.includes("bug") ? 4 : 2, reward: labels.includes("bug") ? 59 : 31, regionKey,
  completedByPr: state === "closed" ? 18 : null,
});
const quests = [
  issue(42, "Race Condition beim Session-Refresh", ["bug", "priority: high"], "auth", 3),
  issue(39, "Quest-Navigation für mobile Ansicht", ["enhancement"], "src", 5),
  issue(36, "API-Fehler besser dokumentieren", ["documentation"], "api", 9),
  issue(33, "Healthchecks für Worker hinzufügen", ["bug"], "workers", 7),
  issue(29, "Ersten Unit-Test beisteuern", ["good first issue"], "tests", 12),
  issue(25, "Token-Refresh stabilisieren", ["bug"], "auth", 18, "closed"),
];
const pulls = [
  { number: 18, title: "fix: auth token refresh", body: "Fixes #25", state: "closed" as const, mergedAt: daysAgo(1), labels: ["bug"], paths: ["auth/session.ts"], url: "https://github.com/octocat/Hello-World/pull/18" },
  { number: 17, title: "feat: responsive quest dashboard", body: "", state: "closed" as const, mergedAt: daysAgo(5), labels: ["enhancement"], paths: ["src/ui.tsx"], url: "https://github.com/octocat/Hello-World/pull/17" },
];
const commits = [
  { sha: "d85fcd1d85fcd1", message: "fix: stabilize session refresh", author: "lavender1510", date: daysAgo(0), paths: ["auth/session.ts"], url: "https://github.com/octocat/Hello-World/commits" },
  { sha: "b4c9482b4c9482", message: "feat: interactive world view", author: "lavender1510", date: daysAgo(1), paths: ["src/map.tsx"], url: "https://github.com/octocat/Hello-World/commits" },
  { sha: "a82d503a82d503", message: "test: cover agent progression", author: "lavender1510", date: daysAgo(2), paths: ["tests/agent.test.ts"], url: "https://github.com/octocat/Hello-World/commits" },
];
const workflows = [
  { id: 1, name: "CI / Build & Test", status: "completed", conclusion: "success", createdAt: daysAgo(0), url: "https://github.com/octocat/Hello-World/actions" },
  { id: 2, name: "CI / Build & Test", status: "completed", conclusion: "failure", createdAt: daysAgo(2), url: "https://github.com/octocat/Hello-World/actions" },
  { id: 3, name: "CI / Build & Test", status: "completed", conclusion: "success", createdAt: daysAgo(3), url: "https://github.com/octocat/Hello-World/actions" },
];
const deployments = [ { id: 1, environment: "production", state: "success", createdAt: daysAgo(1), url: "https://github.com/octocat/Hello-World/deployments" } ];

export const demoDashboard: DashboardData = {
  repository: { owner: "octocat", name: "Hello-World", fullName: "octocat/Hello-World", url: "https://github.com/octocat/Hello-World", isPrivate: false, defaultBranch: "main" },
  agent: buildAgent(quests, pulls, workflows, deployments),
  regions: buildRegions(["src", "auth", "api", "workers", "tests", "docs"], quests, commits, workflows),
  quests, commits, pulls, workflows, deployments,
  chronicle: buildChronicle(quests, pulls, workflows, deployments, commits),
  syncedAt: daysAgo(0), warnings: [],
};
