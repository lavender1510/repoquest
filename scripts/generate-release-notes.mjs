import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const tag = process.argv[2] ?? "v1.0.0";
const target = process.argv[3] ?? "generated-notes.md";
const output = (args) => {
  try { return execFileSync("git", args, { encoding: "utf8" }).trim(); }
  catch { return ""; }
};
const previous = output(["tag", "--sort=-version:refname"]).split("\n").filter((name) => name && name !== tag)[0];
const range = previous ? `${previous}..${tag}` : tag;
const lines = output(["log", "--pretty=format:%s", range]).split("\n").filter(Boolean);
const groups = new Map([
  ["Features", []], ["Bugfixes", []], ["Performance", []], ["Dokumentation", []], ["Wartung & Sonstiges", []],
]);
for (const line of lines) {
  const match = line.match(/^(feat|fix|perf|docs|chore|refactor|test|build|ci)(?:\([^)]+\))?(!)?:\s*(.+)$/i);
  const heading = match ? ({ feat: "Features", fix: "Bugfixes", perf: "Performance", docs: "Dokumentation" })[match[1].toLowerCase()] ?? "Wartung & Sonstiges" : "Wartung & Sonstiges";
  groups.get(heading).push(`- ${match ? match[3] : line}${match?.[2] ? " ⚠ Breaking Change" : ""}`);
}
let notes = tag === "v1.0.0" ? readFileSync("RELEASE_NOTES.md", "utf8").trim() : `# RepoQuest ${tag}\n\nAutomatischer GitHub-Release.`;
notes += "\n\n## Änderungen seit dem letzten Release\n";
for (const [heading, messages] of groups) if (messages.length) notes += `\n### ${heading}\n${messages.join("\n")}\n`;
if (!lines.length) notes += "\n- Initialer Stand ohne weitere Commits.\n";
if (previous) notes += `\nVergleich: https://github.com/lavender1510/repoquest/compare/${previous}...${tag}\n`;
writeFileSync(target, `${notes.trim()}\n`);
console.log(`Release Notes written to ${target}`);
