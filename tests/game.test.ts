import { describe, expect, it } from "vitest";
import { buildAgent, calculateXp, earnedAbilities, getQuestKind, levelFromXp, linkedIssuesFromPr, mapIssueToQuest } from "@/lib/game/rules";
import { assignRegion, buildRegions, calculateRegionHealth, getRegionKey, regionStatus } from "@/lib/game/world";
import { repositoryInputSchema } from "@/lib/github/validation";
import type { DeploymentData, IssueData, PullRequestData, QuestData, WorkflowData } from "@/types/dashboard";

const createIssue = (overrides: Partial<IssueData> = {}): IssueData => ({
  number: 42, title: "Bug in auth/session.ts", body: "Fix auth/session.ts", state: "open", labels: ["bug"],
  createdAt: "2026-10-01T10:00:00Z", closedAt: null, url: "https://github.com/octocat/Hello-World/issues/42", ...overrides,
});
const pr: PullRequestData = { number: 5, title: "fix: auth", body: "Fixes #42", state: "closed", mergedAt: "2026-10-12T12:00:00Z", labels: ["bug"], paths: ["auth/session.ts"], url: "https://github.com/octocat/Hello-World/pull/5" };
const run: WorkflowData = { id: 24, name: "CI", status: "completed", conclusion: "success", createdAt: "2026-10-11T12:00:00Z", url: "https://github.com/octocat/Hello-World/actions" };
const deploy: DeploymentData = { id: 3, environment: "production", state: "success", createdAt: "2026-10-12T10:00:00Z", url: "https://github.com/octocat/Hello-World/deployments" };

describe("XP und Level", () => {
  it("vergibt alle vorgeschriebenen XP ohne doppelte IDs", () => {
    expect(calculateXp([createIssue({ state: "closed" }), createIssue({ state: "closed" })], [pr, pr], [run, run], [deploy, deploy])).toBe(210);
  });
  it("vergibt keinen Bonus für nicht gemergte PRs oder fehlgeschlagene CI", () => {
    expect(calculateXp([], [{ ...pr, mergedAt: null }], [{ ...run, conclusion: "failure" }], [{ ...deploy, state: "failure" }])).toBe(0);
  });
  it("steigt bei genau 100 XP auf und schaltet eine Fähigkeit frei", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(250)).toBe(3);
    expect(earnedAbilities(1)).toEqual([]);
    expect(earnedAbilities(2)).toHaveLength(1);
  });
  it("berechnet Agentenwerte konsistent", () => {
    const agent = buildAgent([createIssue({ state: "closed" })], [pr], [run], [deploy]);
    expect(agent.xp).toBe(210);
    expect(agent.level).toBe(3);
    expect(agent.hp).toBe(100);
  });
});

describe("Quest-Mapping", () => {
  it.each([
    [["bug"], "monster"], [["BUG"], "monster"], [["enhancement"], "build"], [["feature"], "build"],
    [["documentation"], "research"], [["good first issue", "bug"], "tutorial"], [[], "explore"],
  ] as const)("mappt %j auf %s", (labels, kind) => {
    expect(getQuestKind([...labels])).toBe(kind);
  });
  it("markiert nur durch einen gemergten PR referenzierte geschlossene Issues als erledigt", () => {
    const closed = createIssue({ state: "closed", closedAt: "2026-10-12T13:00:00Z" });
    const completed = mapIssueToQuest(closed, "auth", [pr]);
    expect(completed.completedByPr).toBe(5);
    expect(completed.kind).toBe("monster");
    expect(completed.regionKey).toBe("auth");
    expect(mapIssueToQuest(closed, "auth", [{ ...pr, mergedAt: null }]).completedByPr).toBeNull();
    expect(mapIssueToQuest(createIssue(), "auth", [pr]).completedByPr).toBeNull();
  });
  it("interpretiert GitHub Closing Keywords eindeutig", () => {
    expect(linkedIssuesFromPr({ title: "fix: workflow", body: "Closes #12 and resolves #42. See #91" })).toEqual([12, 42]);
  });
});

describe("Weltregionen", () => {
  it("ordnet Regionen anhand von Verzeichnisnamen zu", () => {
    expect(getRegionKey("auth/session.ts fails", ["auth", "src"])).toBe("auth");
    expect(assignRegion(createIssue(), ["auth", "src"])).toBe("auth");
    expect(getRegionKey("something else", ["auth"])).toBe("root");
  });
  it("begrenzt Region-Health auf 0–100", () => {
    const monster = mapIssueToQuest(createIssue(), "auth", []);
    expect(calculateRegionHealth([], 0, 0)).toBe(100);
    expect(calculateRegionHealth([monster], 0, 0)).toBe(82);
    expect(calculateRegionHealth(Array(30).fill(monster), 99, 100)).toBe(0);
  });
  it("vergibt Bossstatus bei kritischen Monster-Regionen", () => {
    const monster: QuestData = { ...mapIssueToQuest(createIssue(), "auth", []), difficulty: 5 };
    expect(regionStatus(20, [monster])).toBe("boss");
    expect(regionStatus(20, [])).toBe("cursed");
    expect(regionStatus(90, [monster])).toBe("healthy");
  });
  it("erzeugt eine Wurzelregion und die Ordner mit anklickbaren Kartenkoordinaten", () => {
    const result = buildRegions(["auth", "src"], [mapIssueToQuest(createIssue(), "auth", [])], [], [run]);
    expect(result.map((r) => r.key)).toEqual(["root", "auth", "src"]);
    expect(result.find((r) => r.key === "auth")?.openIssues).toBe(1);
    expect(result.every((r) => r.x >= 0 && r.x <= 100 && r.y >= 0 && r.y <= 100)).toBe(true);
  });
});

describe("Formularvalidierung", () => {
  it("akzeptiert GitHub-Repository-Parameter", () => {
    expect(repositoryInputSchema.safeParse({ owner: "lavender1510", repo: "repoquest" }).success).toBe(true);
    expect(repositoryInputSchema.safeParse({ owner: "a/b", repo: "repoquest" }).success).toBe(false);
    expect(repositoryInputSchema.safeParse({ owner: "lavender1510", repo: ".." }).success).toBe(false);
  });
});
