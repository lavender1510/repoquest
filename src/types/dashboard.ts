export type QuestKind = "monster" | "build" | "research" | "tutorial" | "explore";
export type RegionStatus = "healthy" | "damaged" | "cursed" | "boss";
export type EventKind = "issue" | "victory" | "ci" | "deployment" | "commit";

export interface RepositoryInfo {
  owner: string;
  name: string;
  fullName: string;
  isPrivate: boolean;
  url: string;
  defaultBranch: string;
}
export interface CommitData {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  paths: string[];
}
export interface IssueData {
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  labels: string[];
  createdAt: string;
  closedAt: string | null;
  url: string;
}
export interface PullRequestData {
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  mergedAt: string | null;
  labels: string[];
  paths: string[];
  url: string;
}
export interface WorkflowData {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  createdAt: string;
  url: string;
}
export interface DeploymentData {
  id: number;
  environment: string;
  state: string;
  createdAt: string;
  url: string;
}
export interface QuestData extends IssueData {
  kind: QuestKind;
  difficulty: number;
  reward: number;
  regionKey: string;
  completedByPr: number | null;
}
export interface RegionData {
  key: string;
  name: string;
  health: number;
  complexity: number;
  openIssues: number;
  status: RegionStatus;
  questNumbers: number[];
  commits: CommitData[];
  x: number;
  y: number;
}
export interface AgentData {
  name: string;
  className: string;
  level: number;
  xp: number;
  hp: number;
  gold: number;
  skills: { debugging: number; refactoring: number; testing: number; deployment: number };
  abilities: string[];
}
export interface ChronicleEventData {
  key: string;
  kind: EventKind;
  text: string;
  occurredAt: string;
  url?: string;
}
export interface DashboardData {
  repository: RepositoryInfo;
  agent: AgentData;
  regions: RegionData[];
  quests: QuestData[];
  commits: CommitData[];
  pulls: PullRequestData[];
  workflows: WorkflowData[];
  deployments: DeploymentData[];
  chronicle: ChronicleEventData[];
  syncedAt: string;
  warnings: string[];
}
