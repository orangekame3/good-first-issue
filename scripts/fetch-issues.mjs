import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const ORG = process.env.GITHUB_ORG || "oqtopus-team";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "public/data";
const OUTPUT_FILE = path.join(OUTPUT_DIR, "issues.json");
const API_VERSION = "2022-11-28";
const USER_AGENT = "oqtopus-good-first-issue-page";

const token = process.env.GITHUB_TOKEN;

async function github(pathname, params = {}) {
  const url = new URL(pathname, "https://api.github.com");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION,
      "User-Agent": USER_AGENT,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API failed: ${response.status} ${response.statusText}\n${body}`);
  }

  return response.json();
}

function repoNameFromUrl(repositoryUrl) {
  return repositoryUrl.split("/").slice(-2).join("/");
}

function normalizeIssue(issue) {
  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    repository: repoNameFromUrl(issue.repository_url),
    author: issue.user?.login ?? null,
    labels: issue.labels.map((label) => ({
      name: label.name,
      color: label.color,
      description: label.description,
    })),
    comments: issue.comments,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
  };
}

async function fetchGoodFirstIssues() {
  const query = `org:${ORG} is:issue is:open label:"good first issue"`;
  const issues = [];
  let totalCount = 0;

  for (let page = 1; page <= 10; page += 1) {
    const data = await github("/search/issues", {
      q: query,
      sort: "updated",
      order: "desc",
      per_page: "100",
      page: String(page),
    });

    totalCount = data.total_count;
    issues.push(...data.items.map(normalizeIssue));

    if (issues.length >= data.total_count || data.items.length === 0) {
      break;
    }
  }

  return {
    org: ORG,
    query,
    totalCount,
    fetchedCount: issues.length,
    generatedAt: new Date().toISOString(),
    issues,
  };
}

await mkdir(OUTPUT_DIR, { recursive: true });
const payload = await fetchGoodFirstIssues();
const tmpFile = `${OUTPUT_FILE}.tmp`;
await writeFile(tmpFile, `${JSON.stringify(payload, null, 2)}\n`);
await rename(tmpFile, OUTPUT_FILE);

console.log(`Fetched ${payload.fetchedCount}/${payload.totalCount} issues for ${ORG}`);
