import type { Octokit } from "@octokit/rest";
import type { CommitData, DeploymentData, IssueData, PullRequestData, RepositoryInfo, WorkflowData } from "@/types/dashboard";
import { connectRepository, githubError } from "./client";

export interface ImportedRepository {
  repository: RepositoryInfo;
  directories: string[];
  commits: CommitData[];
  issues: IssueData[];
  pulls: PullRequestData[];
  workflows: WorkflowData[];
  deployments: DeploymentData[];
  warnings: string[];
}

type GitHubClient = Octokit;
const nonEmpty = (value: string | null | undefined) => value ?? "";
const labelsOf = (items: Array<string | { name?: string | null }>) => items.map((item) => typeof item === "string" ? item : nonEmpty(item.name)).filter(Boolean);

export async function importRepository(owner: string, repo: string): Promise<ImportedRepository> {
  const { client, info } = await connectRepository(owner, repo);
  const warnings: string[] = [];
  const inputs = { owner, repo };
  // Issues/PRs and commits are required. CI and deployment visibility depend on GitHub permissions.
  const [commitsResponse, openIssuesResponse, closedIssuesResponse, pullsResponse] = await Promise.all([
    client.rest.repos.listCommits({ ...inputs, per_page: 100 }),
    client.rest.issues.listForRepo({ ...inputs, state: "open", per_page: 100, sort: "updated", direction: "desc" }),
    client.rest.issues.listForRepo({ ...inputs, state: "closed", per_page: 100, sort: "updated", direction: "desc" }),
    client.rest.pulls.list({ ...inputs, state: "all", per_page: 100, sort: "updated", direction: "desc" }),
  ]).catch((error: unknown) => { throw githubError(error); });

  const commits: CommitData[] = commitsResponse.data.map((item) => ({
    sha: item.sha,
    message: item.commit.message,
    author: item.commit.author?.name ?? item.author?.login ?? "Unbekannt",
    date: item.commit.author?.date ?? item.commit.committer?.date ?? new Date(0).toISOString(),
    url: item.html_url,
    paths: [],
  }));
  const issues: IssueData[] = [...openIssuesResponse.data, ...closedIssuesResponse.data]
    .filter((item) => !item.pull_request)
    .map((item) => ({
      number: item.number, title: item.title, body: item.body ?? "", state: item.state === "closed" ? "closed" : "open",
      labels: labelsOf(item.labels), createdAt: item.created_at, closedAt: item.closed_at, url: item.html_url,
    }));
  const pulls: PullRequestData[] = pullsResponse.data.map((item) => ({
    number: item.number, title: item.title, body: item.body ?? "", state: item.state === "closed" ? "closed" : "open",
    mergedAt: item.merged_at ?? null, labels: labelsOf(item.labels), paths: [], url: item.html_url,
  }));

  const optional = async <T>(action: () => Promise<T>, name: string, fallback: T): Promise<T> => {
    try { return await action(); } catch (error) {
      warnings.push(`${name}: ${githubError(error).message}`);
      return fallback;
    }
  };

  const [tree, workflowsRaw, deploymentsRaw] = await Promise.all([
    optional(async () => (await client.rest.repos.getContent({ ...inputs, path: "" })).data, "Verzeichnisstruktur", []),
    optional(async () => (await client.rest.actions.listWorkflowRunsForRepo({ ...inputs, per_page: 25 })).data.workflow_runs, "CI-Läufe", []),
    optional(async () => (await client.rest.repos.listDeployments({ ...inputs, per_page: 10 })).data, "Deployments", []),
  ]);
  const directories = Array.isArray(tree) ? tree.filter((file) => file.type === "dir").map((file) => file.name).slice(0, 24) : [];
  const workflows: WorkflowData[] = workflowsRaw.map((run) => ({
    id: run.id, name: run.name ?? "Workflow", status: run.status ?? "unknown", conclusion: run.conclusion ?? null,
    createdAt: run.created_at, url: run.html_url,
  }));
  const deployments: DeploymentData[] = await mapDeployments(client, owner, repo, deploymentsRaw, warnings);

  // File-level details are opportunistic; bounded fan-out avoids burning unauthenticated quotas.
  await Promise.all([
    ...commits.slice(0, 12).map(async (commit) => {
      const filenames = await optional(async () => {
        const response = await client.rest.repos.getCommit({ ...inputs, ref: commit.sha });
        return response.data.files?.map((file) => file.filename) ?? [];
      }, `Commit ${commit.sha.slice(0, 7)}`, [] as string[]);
      commit.paths = filenames;
    }),
    ...pulls.slice(0, 8).map(async (pr) => {
      pr.paths = await optional(async () => {
        const response = await client.rest.pulls.listFiles({ ...inputs, pull_number: pr.number, per_page: 100 });
        return response.data.map((file) => file.filename);
      }, `PR #${pr.number}`, [] as string[]);
    }),
  ]);

  return {
    repository: {
      owner: info.owner.login, name: info.name, fullName: info.full_name, isPrivate: info.private,
      url: info.html_url, defaultBranch: info.default_branch,
    },
    directories, commits, issues, pulls, workflows, deployments, warnings,
  };
}

async function mapDeployments(client: GitHubClient, owner: string, repo: string, rows: Array<{ id: number; environment: string; created_at: string; url: string }>, warnings: string[]): Promise<DeploymentData[]> {
  return Promise.all(rows.map(async (row): Promise<DeploymentData> => {
    let state = "unknown";
    try {
      const response = await client.rest.repos.listDeploymentStatuses({ owner, repo, deployment_id: row.id, per_page: 1 });
      state = response.data[0]?.state ?? "pending";
    } catch (error) { warnings.push(`Deployment #${row.id}: ${githubError(error).message}`); }
    return { id: row.id, environment: row.environment || "production", state, createdAt: row.created_at, url: `https://github.com/${owner}/${repo}/deployments` };
  }));
}
