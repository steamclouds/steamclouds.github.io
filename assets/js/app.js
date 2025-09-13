// Example release data (bisa diganti fetch JSON nanti)
const releases = [
  { version: "1.2.0", date: "2025-09-13", notes: "New features and bug fixes", url: "#" },
  { version: "1.1.0", date: "2025-08-05", notes: "Performance improvements", url: "#" },
  { version: "1.0.0", date: "2025-07-20", notes: "Initial release", url: "#" },
];

// DOM references
const releaseList = document.getElementById("release-list");
const searchInput = document.getElementById("search");
const themeToggle = document.getElementById("themeToggle");

// Render releases
function renderReleases(filter = "") {
  releaseList.innerHTML = "";
  const filtered = releases.filter(r =>
    r.version.toLowerCase().includes(filter.toLowerCase()) ||
    r.notes.toLowerCase().includes(filter.toLowerCase())
  );
  if (filtered.length === 0) {
    releaseList.innerHTML = "<p>No releases found.</p>";
    return;
  }
  filtered.forEach(r => {
    const card = document.createElement("div");
    card.className = "release-card";
    card.innerHTML = `
      <h2>Version ${r.version}</h2>
      <p>${r.notes}</p>
      <small>Released: ${r.date}</small><br/>
      <button onclick="window.location.href='${r.url}'">Download</button>
    `;
    releaseList.appendChild(card);
  });
}

// Search filter
searchInput.addEventListener("input", e => {
  renderReleases(e.target.value);
});

// Theme toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

// Load saved theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️";
}

// Initial render
renderReleases();
