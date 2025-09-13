
const releases = [
  { version: "1.2.0", date: "2025-09-13", notes: "New features and bug fixes", url: "#" },
  { version: "1.1.0", date: "2025-08-05", notes: "Performance improvements", url: "#" },
  { version: "1.0.0", date: "2025-07-20", notes: "Initial release", url: "#" },
];

// DOM references
const releaseList = document.getElementById("release-list");
const searchInput = document.getElementById("search");
const themeToggle = document.getElementById("themeToggle");

// Helper to escape text for HTML (basic)
function escapeHtml(s){
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":"&#39;"
  })[c]);
}

// Helper to safe-href (fallback to '#' if empty)
function safeHref(s){
  try {
    if(!s) return '#';
    // if it's already a hash or starts with http(s) keep it, else encode
    if (s.startsWith('#') || s.startsWith('http://') || s.startsWith('https://')) return s;
    return encodeURI(s);
  } catch(e){ return '#'; }
}

// Render releases
function renderReleases(filter = "") {
  if(!releaseList) return;
  releaseList.innerHTML = "";
  const q = String(filter || "").toLowerCase().trim();

  const filtered = releases.filter(r =>
    r.version.toLowerCase().includes(q) ||
    r.notes.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    releaseList.innerHTML = "<p>No releases found.</p>";
    return;
  }

  filtered.forEach(r => {
    const card = document.createElement("div");
    card.className = "release-card";

    // build inner HTML using escaped content
    card.innerHTML = `
      <div class="card-main">
        <h2>Version ${escapeHtml(r.version)}</h2>
        <p>${escapeHtml(r.notes)}</p>
        <div class="meta">Released: ${escapeHtml(r.date)}</div>
      </div>
      <div class="card-actions">
        <a class="btn small" href="${safeHref(r.url)}" target="_blank" rel="noopener">Download</a>
      </div>
    `;

    releaseList.appendChild(card);
  });
}

// Search filter (debounced)
let searchTimer = null;
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => renderReleases(e.target.value), 180);
  });
}

// Theme toggle
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  });
}

// Load saved theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  if (themeToggle) themeToggle.textContent = "☀️";
}

// Initial render on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  renderReleases();
});
