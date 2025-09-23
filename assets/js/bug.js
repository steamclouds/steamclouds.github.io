// ====== CONFIG ======
const GH_OWNER = "steamcloud";
const GH_REPO  = "steamclouds.github.io";

// ====== DOM ======
const issueListEl   = document.getElementById("issueList");
const refreshBtn    = document.getElementById("refreshBtn");
const rateInfoEl    = document.getElementById("rateInfo");
const formEl        = document.getElementById("issueForm");
const tokenEl       = document.getElementById("token");
const titleEl       = document.getElementById("title");
const bodyEl        = document.getElementById("body");
const titleErrEl    = document.getElementById("titleErr");
const bodyErrEl     = document.getElementById("bodyErr");
const submitBtn     = document.getElementById("submitBtn");
const submitStatus  = document.getElementById("submitStatus");
const labelsEl      = document.getElementById("labels");
const tplItem       = document.getElementById("issueItemTpl");

const chips = Array.from(document.querySelectorAll(".chip"));
let currentState = "open";

// ====== Helpers ======
function ghHeaders(token) {
  const h = { "Accept": "application/vnd.github+json" };
  if (token) h.Authorization = `token ${token.trim()}`;
  return h;
}

function since(timeStr) {
  const t = new Date(timeStr);
  const s = Math.floor((Date.now() - t.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function clearErrors() {
  titleErrEl.textContent = "";
  bodyErrEl.textContent = "";
}

function validate() {
  clearErrors();
  let ok = true;
  if (!titleEl.value.trim()) {
    titleErrEl.textContent = "Title is required.";
    ok = false;
  }
  if (!bodyEl.value.trim()) {
    bodyErrEl.textContent = "Description is required.";
    ok = false;
  }
  if (!tokenEl.value.trim()) {
    submitStatus.className = "status warn";
    submitStatus.textContent = "Submitting requires a GitHub token.";
    ok = false;
  }
  return ok;
}

function selectedLabels() {
  return Array.from(labelsEl.selectedOptions).map(o => o.value);
}

function renderIssue(item) {
  const a = tplItem.content.firstElementChild.cloneNode(true);
  const url = item.html_url;
  a.href = url;

  if (item.state === "closed") a.classList.add("closed");
  a.querySelector(".issue-title").textContent = item.title || "(no title)";
  a.querySelector(".issue-number").textContent = `#${item.number}`;
  a.querySelector(".issue-author").textContent = `by ${item.user?.login ?? "unknown"}`;
  a.querySelector(".issue-time").textContent = since(item.created_at);

  const labelsWrap = a.querySelector(".issue-labels");
  (item.labels || []).forEach(l => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = typeof l === "string" ? l : l.name;
    labelsWrap.appendChild(tag);
  });

  return a;
}

function showRateInfo(headers) {
  const remain = headers.get("x-ratelimit-remaining");
  const limit  = headers.get("x-ratelimit-limit");
  if (remain && limit) {
    rateInfoEl.innerHTML = `Rate limit: <strong>${remain}</strong> / ${limit}`;
  }
}

async function fetchIssues(state = "open") {
  issueListEl.innerHTML = "";
  const placeholder = document.createElement("div");
  placeholder.className = "issue-item";
  placeholder.innerHTML = "Loading issues…";
  issueListEl.appendChild(placeholder);

  try {
    const qs = new URLSearchParams({
      state,
      per_page: "25",
      sort: "created",
      direction: "desc"
    });
    const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/issues?${qs}`, {
      headers: ghHeaders() // unauthenticated for listing is fine, but rate-limited
    });

    showRateInfo(res.headers);

    if (!res.ok) {
      throw new Error(`Failed to fetch issues: ${res.status}`);
    }

    const data = await res.json();
    issueListEl.innerHTML = "";
    if (!Array.isArray(data) || data.length === 0) {
      const empty = document.createElement("div");
      empty.className = "issue-item";
      empty.textContent = `No ${state} issues.`;
      issueListEl.appendChild(empty);
      return;
    }

    data
      .filter(i => !i.pull_request) // exclude PRs
      .forEach(i => issueListEl.appendChild(renderIssue(i)));

  } catch (err) {
    issueListEl.innerHTML = "";
    const e = document.createElement("div");
    e.className = "issue-item";
    e.textContent = err.message || "Error";
    issueListEl.appendChild(e);
  }
}

async function createIssue({ title, body, labels }) {
  const token = tokenEl.value.trim();
  const payload = { title, body, labels };
  const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/issues`, {
    method: "POST",
    headers: {
      ...ghHeaders(token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  showRateInfo(res.headers);

  if (!res.ok) {
    let msg = `Submit failed (${res.status})`;
    try {
      const j = await res.json();
      if (j && j.message) msg += `: ${j.message}`;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ====== Events ======
chips.forEach(ch => {
  ch.addEventListener("click", () => {
    chips.forEach(x => { x.classList.remove("chip-active"); x.setAttribute("aria-pressed","false"); });
    ch.classList.add("chip-active");
    ch.setAttribute("aria-pressed","true");
    currentState = ch.dataset.state;
    fetchIssues(currentState);
  });
});

refreshBtn.addEventListener("click", () => fetchIssues(currentState));

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitStatus.className = "status";
  submitStatus.textContent = "";

  if (!validate()) return;

  submitBtn.disabled = true;
  submitStatus.className = "status";
  submitStatus.textContent = "Submitting…";

  try {
    const result = await createIssue({
      title: titleEl.value.trim(),
      body : bodyEl.value.trim(),
      labels: selectedLabels()
    });

    // success UI
    submitStatus.className = "status ok";
    submitStatus.textContent = `Submitted! #${result.number}`;
    titleEl.value = "";
    bodyEl.value = "";
    labelsEl.selectedIndex = -1;

    // refresh open list
    if (currentState === "open") fetchIssues("open");

  } catch (err) {
    submitStatus.className = "status err";
    submitStatus.textContent = err.message || "Failed to submit.";
  } finally {
    submitBtn.disabled = false;
  }
});

// ====== Init ======
fetchIssues(currentState);
