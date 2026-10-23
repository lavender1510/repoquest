import { Octokit } from "@octokit/rest";

export class ImportError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
    this.name = "ImportError";
  }
}

function statusOf(error: unknown): number | undefined {
  return typeof error === "object" && error !== null && "status" in error && typeof error.status === "number" ? error.status : undefined;
}

export function githubError(error: unknown): ImportError {
  if (error instanceof ImportError) return error;
  const status = statusOf(error);
  const message = error instanceof Error ? error.message : "GitHub antwortet nicht.";
  const headers = typeof error === "object" && error !== null && "response" in error ? (error.response as { headers?: Record<string, string> })?.headers : undefined;
  if (status === 404) return new ImportError("Repository nicht gefunden oder ohne Berechtigung nicht lesbar.", 404);
  if (status === 401) return new ImportError("GitHub-Token ungültig oder abgelaufen. Prüfe GITHUB_TOKEN.", 401);
  if (status === 403 || status === 429) {
    const reset = Number(headers?.["x-ratelimit-reset"] ?? 0);
    if (/rate limit|secondary rate|abuse|quota/i.test(message) || headers?.["x-ratelimit-remaining"] === "0") {
      const when = reset > 0 ? ` Zurückgesetzt: ${new Date(reset * 1000).toLocaleString("de-DE")}.` : "";
      return new ImportError(`GitHub-API-Limit erreicht.${when} Versuche es später erneut oder verwende ein Token.`, 429);
    }
    return new ImportError("GitHub verweigert den Zugriff. Prüfe die Berechtigungen.", 403);
  }
  if (status && status >= 500) return new ImportError("GitHub ist vorübergehend nicht erreichbar.", 502);
  if (/timeout|fetch failed|network/i.test(message)) return new ImportError("Die GitHub-Verbindung ist fehlgeschlagen. Bitte später erneut versuchen.", 502);
  return new ImportError("GitHub-Daten konnten nicht importiert werden.", 502);
}

function isAllowlisted(fullName: string): boolean {
  return (process.env.GITHUB_ALLOWED_REPOS ?? "").split(",").map((entry) => entry.trim().toLowerCase()).includes(fullName.toLowerCase());
}

export async function connectRepository(owner: string, repo: string) {
  const fullName = `${owner}/${repo}`;
  const publicClient = new Octokit({ request: { timeout: 15000 }, userAgent: "repoquest/1.0.0" });
  try {
    const response = await publicClient.rest.repos.get({ owner, repo });
    // Use anonymous client for public repositories; never unintentionally expose PAT-only data.
    return { client: publicClient, info: response.data };
  } catch (error) {
    if (statusOf(error) !== 404 || !process.env.GITHUB_TOKEN || !isAllowlisted(fullName)) throw githubError(error);
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRIVATE_REPOS_IN_PRODUCTION !== "true") {
      throw new ImportError("Private Repositories sind in Produktion gesperrt. Richte zuerst Zugriffsschutz vor RepoQuest ein.", 403);
    }
    const client = new Octokit({ auth: process.env.GITHUB_TOKEN, request: { timeout: 15000 }, userAgent: "repoquest/1.0.0" });
    try {
      const response = await client.rest.repos.get({ owner, repo });
      return { client, info: response.data };
    } catch (privateError) {
      throw githubError(privateError);
    }
  }
}
