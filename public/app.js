const THEME_KEY = "gfi-theme";

function initTheme() {
  // The inline head script already applied the initial theme (URL param,
  // stored preference, or system default). Here we only wire the toggle.
  const toggle = document.querySelector("#themeToggle");
  toggle?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
  });
}

const state = {
  issues: [],
  filtered: [],
};

const elements = {
  searchInput: document.querySelector("#searchInput"),
  repoFilter: document.querySelector("#repoFilter"),
  sortSelect: document.querySelector("#sortSelect"),
  issueCount: document.querySelector("#issueCount"),
  repoCount: document.querySelector("#repoCount"),
  generatedAt: document.querySelector("#generatedAt"),
  resultMeta: document.querySelector("#resultMeta"),
  status: document.querySelector("#status"),
  issueList: document.querySelector("#issueList"),
  template: document.querySelector("#issueTemplate"),
};

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function relativeDate(value) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / 86_400_000));
  if (diffDays === 0) return "updated today";
  if (diffDays === 1) return "updated yesterday";
  return `updated ${diffDays} days ago`;
}

function populateRepos(issues) {
  const repos = [...new Set(issues.map((issue) => issue.repository))].sort();
  for (const repo of repos) {
    const option = document.createElement("option");
    option.value = repo;
    option.textContent = repo;
    elements.repoFilter.append(option);
  }
  elements.repoCount.textContent = String(repos.length);
}

function matchesSearch(issue, query) {
  if (!query) return true;
  const haystack = [
    issue.title,
    issue.repository,
    issue.author ?? "",
    ...issue.labels.map((label) => label.name),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function sortIssues(issues, sort) {
  const sorted = [...issues];
  sorted.sort((a, b) => {
    if (sort === "created-desc") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === "comments-desc") return b.comments - a.comments;
    if (sort === "repo-asc") {
      return `${a.repository}#${a.number}`.localeCompare(`${b.repository}#${b.number}`);
    }
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
  return sorted;
}

function applyFilters() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const repo = elements.repoFilter.value;
  const sort = elements.sortSelect.value;

  state.filtered = sortIssues(
    state.issues.filter((issue) => {
      return (!repo || issue.repository === repo) && matchesSearch(issue, query);
    }),
    sort,
  );

  renderIssues();
}

function renderIssues() {
  elements.issueList.replaceChildren();
  elements.issueCount.textContent = String(state.filtered.length);
  elements.resultMeta.textContent = `${state.filtered.length} shown`;

  if (state.filtered.length === 0) {
    elements.status.hidden = false;
    elements.status.textContent = "No matching issues.";
    elements.issueList.hidden = true;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const issue of state.filtered) {
    const node = elements.template.content.cloneNode(true);
    const row = node.querySelector(".issue-row");
    const repo = node.querySelector(".repo");
    const number = node.querySelector(".issue-number");
    const title = node.querySelector(".title");
    const labels = node.querySelector(".labels");
    const author = node.querySelector(".author");
    const comments = node.querySelector(".comments");
    const updated = node.querySelector(".updated");

    repo.href = `https://github.com/${issue.repository}`;
    repo.textContent = issue.repository;
    number.textContent = `#${issue.number}`;
    title.href = issue.url;
    title.textContent = issue.title;
    author.textContent = issue.author ? `opened by ${issue.author}` : "author unknown";
    comments.textContent = `${issue.comments} ${issue.comments === 1 ? "comment" : "comments"}`;
    updated.textContent = relativeDate(issue.updatedAt);
    row.dataset.repo = issue.repository;

    for (const label of issue.labels) {
      const pill = document.createElement("span");
      pill.className = "label";
      pill.textContent = label.name;
      pill.style.setProperty("--label-color", `#${label.color}`);
      labels.append(pill);
    }

    fragment.append(node);
  }

  elements.status.hidden = true;
  elements.issueList.hidden = false;
  elements.issueList.append(fragment);
}

async function init() {
  try {
    const response = await fetch("./data/issues.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Failed to load issue data: ${response.status}`);
    const data = await response.json();

    state.issues = data.issues;
    state.filtered = data.issues;
    elements.generatedAt.textContent = formatDate(data.generatedAt);
    populateRepos(data.issues);
    applyFilters();
  } catch (error) {
    elements.status.textContent = error.message;
  }
}

elements.searchInput.addEventListener("input", applyFilters);
elements.repoFilter.addEventListener("change", applyFilters);
elements.sortSelect.addEventListener("change", applyFilters);

initTheme();
init();
