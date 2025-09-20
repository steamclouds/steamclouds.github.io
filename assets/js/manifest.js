document.addEventListener('DOMContentLoaded', () => {
    // Initialize particles.js
    particlesJS("particles-js", {
        "particles": {
            "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": "#00ffe1" },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.5, "random": true },
            "size": { "value": 3, "random": true },
            "line_linked": {
                "enable": true,
                "distance": 120,
                "color": "#00ffe1",
                "opacity": 0.4,
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": 2,
                "direction": "none",
                "random": true,
                "straight": false,
                "out_mode": "out",
                "bounce": false,
                "attract": { "enable": false, "rotateX": 600, "rotateY": 1200 }
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": { "enable": true, "mode": "grab" },
                "onclick": { "enable": true, "mode": "push" },
                "resize": true
            },
            "modes": {
                "grab": { "distance": 140, "line_linked": { "opacity": 0.7 } },
                "push": { "particles_nb": 4 }
            }
        },
        "retina_detect": true
    });

    // Custom cursor logic
    const cursor = document.getElementById('custom-cursor');
    if (cursor) {
        let mouseX = 0, mouseY = 0;
        let posX = 0, posY = 0;
        const speed = 0.15;

        document.addEventListener('mousemove', e => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function animate() {
            posX += (mouseX - posX) * speed;
            posY += (mouseY - posY) * speed;
            cursor.style.transform = `translate(${posX}px, ${posY}px) translate(-50%, -50%)`;
            requestAnimationFrame(animate);
        }
        animate();

        document.addEventListener('mousedown', () => {
            cursor.style.width = '36px';
            cursor.style.height = '36px';
            cursor.style.background = 'rgba(0, 255, 225, 1)';
            setTimeout(() => {
                cursor.style.width = '24px';
                cursor.style.height = '24px';
                cursor.style.background = 'rgba(0, 255, 225, 0.7)';
            }, 150);
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Initialize particles.js
    particlesJS("particles-js", {
        "particles": {
            "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": "#00ffe1" },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.5, "random": true },
            "size": { "value": 3, "random": true },
            "line_linked": {
                "enable": true,
                "distance": 120,
                "color": "#00ffe1",
                "opacity": 0.4,
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": 2,
                "direction": "none",
                "random": true,
                "straight": false,
                "out_mode": "out",
                "bounce": false,
                "attract": { "enable": false, "rotateX": 600, "rotateY": 1200 }
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": { "enable": true, "mode": "grab" },
                "onclick": { "enable": true, "mode": "push" },
                "resize": true
            },
            "modes": {
                "grab": { "distance": 140, "line_linked": { "opacity": 0.7 } },
                "push": { "particles_nb": 4 }
            }
        },
        "retina_detect": true
    });

    // Custom cursor logic
    const cursor = document.getElementById('custom-cursor');
    if (cursor) {
        let mouseX = 0, mouseY = 0;
        let posX = 0, posY = 0;
        const speed = 0.15;

        document.addEventListener('mousemove', e => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function animate() {
            posX += (mouseX - posX) * speed;
            posY += (mouseY - posY) * speed;
            cursor.style.transform = `translate(${posX}px, ${posY}px) translate(-50%, -50%)`;
            requestAnimationFrame(animate);
        }
        animate();

        document.addEventListener('mousedown', () => {
            cursor.style.width = '36px';
            cursor.style.height = '36px';
            cursor.style.background = 'rgba(0, 255, 225, 1)';
            setTimeout(() => {
                cursor.style.width = '24px';
                cursor.style.height = '24px';
                cursor.style.background = 'rgba(0, 255, 225, 0.7)';
            }, 150);
        });
    }
});

// Add these helpers near the top of your script (once)
const CACHE_TTL_SEC = 600; // 10 minutes

function cacheKey(repo, appid) {
  return `manifest_tree|${repo}|${appid}`;
}

function cacheSetTree(repo, appid, treeData, usedRef = null, ttlSec = CACHE_TTL_SEC) {
  try {
    const payload = {
      data: treeData,
      ref: usedRef,
      exp: Date.now() + ttlSec * 1000
    };
    sessionStorage.setItem(cacheKey(repo, appid), JSON.stringify(payload));
  } catch (e) {
    console.warn("cacheSetTree failed", e);
  }
}

function cacheGetTree(repo, appid) {
  try {
    const raw = sessionStorage.getItem(cacheKey(repo, appid));
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.exp || Date.now() > obj.exp) {
      sessionStorage.removeItem(cacheKey(repo, appid));
      return null;
    }
    return obj; // { data, ref, exp }
  } catch (e) {
    console.warn("cacheGetTree failed", e);
    return null;
  }
}

// Replace your generateManifest() with this version (includes caching)
async function generateManifest() {
    let inputElement = document.getElementById('appidInput');
    if (!inputElement) {
        console.error("AppID input field not found!");
        document.getElementById('result').innerHTML = `<p style="color:red;">❌ Error: Input field not found.</p>`;
        return;
    }

    let input = inputElement.value.trim();
    if (!input) {
        document.getElementById('result').innerHTML = `<p style="color:red;">❌ Please enter an AppID or URL.</p>`;
        return;
    }

    // Extract AppID from URL if necessary
    const steamAppUrlPattern = /https?:\/\/store\.steampowered\.com\/app\/(\d+)/i;
    const match = input.match(steamAppUrlPattern);
    let appid = input;

    if (match && match[1]) {
        appid = match[1];
    }

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = "⏳ Fetching files from repositories...";

    const repos = [
        "SteamAutoCracks/ManifestHub",
        "ikun0014/ManifestHub",
        "Auiowu/ManifestAutoUpdate",
        "tymolu233/ManifestAutoUpdate-fix"
    ];

    let foundFiles = [];
    let foundInRepo = "";
    let totalSize = 0;
    let fetchErrors = [];

    // helper to fetch with a small timeout wrapper
    const fetchWithTimeout = (url, opts = {}, ms = 20000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), ms);
      return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(id));
    };

    for (const repo of repos) {
        try {
            resultDiv.innerHTML = `🔍 Searching in repository: ${repo}...`;

            // check cache first
            const cached = cacheGetTree(repo, appid);
            let treeData = null;
            let usedRef = null; // ref/branch/sha we used to fetch this tree

            if (cached && cached.data) {
              treeData = cached.data;
              usedRef = cached.ref || appid;
              console.log(`Using cached tree for ${repo} / ${appid} (ref: ${usedRef})`);
            } else {
              // build api url correctly (no extra spaces)
              const githubApiUrl = `https://api.github.com/repos/${repo}/git/trees/${encodeURIComponent(appid)}?recursive=1`;

              // try branch-as-appid first
              let treeResponse;
              try {
                treeResponse = await fetchWithTimeout(githubApiUrl);
              } catch (errFetch) {
                // network or CORS; record and try next repo (or fallback to server in your other flow)
                const errorMsg = `Fetch error for ${repo}: ${errFetch.message || errFetch}`;
                console.warn(errorMsg);
                fetchErrors.push(`[${repo}] ${errorMsg}`);
                continue;
              }

              if (!treeResponse.ok) {
                // not OK: capture error and try to continue (maybe branch doesn't exist)
                const errorMsg = `Status ${treeResponse.status} (${treeResponse.statusText}) for ${repo}`;
                console.warn(`Could not fetch branch in ${repo}:`, errorMsg);
                fetchErrors.push(`[${repo}] ${errorMsg}`);
                // continue to next repo (optionally: you could attempt default branch here)
                continue;
              }

              const json = await treeResponse.json();

              // If GitHub returned only { sha, url } follow url + recursive
              if (!json.tree && json.url) {
                try {
                  const followResp = await fetchWithTimeout(json.url + '?recursive=1');
                  if (followResp.ok) {
                    const followJson = await followResp.json();
                    if (followJson && followJson.tree) {
                      treeData = followJson;
                      usedRef = json.sha || appid; // use sha as ref if available
                    }
                  } else {
                    const errorMsg = `Second fetch returned ${followResp.status}`;
                    console.warn(errorMsg);
                    fetchErrors.push(`[${repo}] ${errorMsg}`);
                    continue;
                  }
                } catch (errFollow) {
                  const errorMsg = `Follow fetch error for ${repo}: ${errFollow.message || errFollow}`;
                  console.warn(errorMsg);
                  fetchErrors.push(`[${repo}] ${errorMsg}`);
                  continue;
                }
              } else {
                // direct tree response
                treeData = json;
                usedRef = appid;
              }

              // cache the treeData (so subsequent calls in session don't hit GitHub)
              if (treeData && treeData.tree) {
                cacheSetTree(repo, appid, treeData, usedRef, CACHE_TTL_SEC);
              }
            } // end cache check

            if (!treeData || !treeData.tree) {
                const errorMsg = `Invalid response structure from ${repo}`;
                console.warn(errorMsg);
                fetchErrors.push(`[${repo}] ${errorMsg}`);
                continue;
            }

            const files = treeData.tree.filter(file => file.type === 'blob');

            if (files.length === 0) {
                const errorMsg = `No files found in branch '${appid}' in ${repo}`;
                console.warn(errorMsg);
                fetchErrors.push(`[${repo}] ${errorMsg}`);
                continue;
            }

            // --- Pemeriksaan Baru: Cari Key.vdf dan verifikasi AppID ---
            let keyVdfFile = files.find(f => f.path.toLowerCase().includes('key.vdf') || f.path.toLowerCase().includes('config.vdf'));
            
            if (!keyVdfFile) {
                console.warn(`No Key.vdf or config.vdf found in ${repo}/${appid}. Skipping verification (accepting files in this branch).`);
                // Jika tidak ada file kunci, asumsikan branch valid (fallback)
                foundFiles = files;
                foundInRepo = repo;
                // record usedRef so downloads use correct ref
                // attach usedRef to foundInRepo for later (we can store as object if needed)
                break;
            }

            // Unduh dan baca isi Key.vdf
            // use usedRef if present (from cache or earlier fetch); fallback to appid
            const refToUse = (cached && cached.ref) ? cached.ref : (typeof usedRef !== 'undefined' ? usedRef : appid);
            const keyVdfUrl = `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(refToUse)}/${keyVdfFile.path}`;
            const keyVdfResponse = await fetchWithTimeout(keyVdfUrl);
            if (!keyVdfResponse.ok) {
                console.warn(`Failed to download ${keyVdfFile.path} from ${repo} (ref: ${refToUse})`, keyVdfResponse.status);
                fetchErrors.push(`[${repo}] Failed to download key: ${keyVdfResponse.status}`);
                continue; // Lanjut ke repo lain jika gagal unduh Key.vdf
            }

            const keyVdfText = await keyVdfResponse.text();
            // Gunakan regex sederhana untuk mencari AppID di teks VDF
            const appIdRegex = new RegExp(`"${appid}"\\s*\\{`);
            if (!appIdRegex.test(keyVdfText)) {
                console.warn(`AppID ${appid} not found in ${keyVdfFile.path} from ${repo}. Likely incorrect branch.`);
                fetchErrors.push(`[${repo}] AppID not found in key`);
                continue; // Branch salah, coba repo berikutnya
            }

            // Jika lolos verifikasi, gunakan file dari branch ini
            foundFiles = files;
            foundInRepo = repo;
            // store usedRef on foundInRepo so download uses correct ref (we'll put it in a variable)
            var finalRefForDownload = refToUse;
            resultDiv.innerHTML = `✅ Files found and verified in ${repo}. Downloading...`;
            break; // Keluar dari loop

        } catch (err) {
            const errorMsg = `Network or processing error for ${repo}: ${err && err.message ? err.message : err}`;
            console.error(errorMsg, err);
            fetchErrors.push(`[${repo}] ${errorMsg}`);
        }
    }

    if (foundFiles.length === 0) {
        const errorDetails = fetchErrors.length > 0 ? `<br><small>Details:<br>${fetchErrors.join('<br>')}</small>` : '';
        resultDiv.innerHTML = `<p style="color:red;">❌ Manifest not found for AppID ${appid} in any repository.${errorDetails}</p>`;
        return;
    }

    const startTime = performance.now();
    const zip = new JSZip();

    try {
        for (const file of foundFiles) {
            // if we set finalRefForDownload use it, otherwise fallback to appid
            const refForDownload = (typeof finalRefForDownload !== 'undefined' && finalRefForDownload) ? finalRefForDownload : appid;
            const fileUrl = `https://raw.githubusercontent.com/${foundInRepo}/${encodeURIComponent(refForDownload)}/${file.path}`;
            resultDiv.innerHTML = `🔄 Downloading ${file.path}...`;

            const fileResponse = await fetchWithTimeout(fileUrl);
            if (!fileResponse.ok) {
                console.error(`Failed to download ${file.path}`, fileResponse.status, fileResponse.statusText);
                resultDiv.innerHTML += `<br><small style="color:orange;">Warning: Could not download ${file.path} (Status: ${fileResponse.status}). Skipping...</small>`;
                continue;
            }

            const contentBlob = await fileResponse.blob();
            const arrayBuffer = await contentBlob.arrayBuffer();
            zip.file(file.path, arrayBuffer);
            totalSize += contentBlob.size;
        }

        const finalZipBlob = await zip.generateAsync({ type: "blob" });
        const downloadUrl = URL.createObjectURL(finalZipBlob);
        const elapsedTime = ((performance.now() - startTime) / 1000).toFixed(2);

        resultDiv.innerHTML = `
            <h2>✅ Manifest Ready</h2>
            <p><strong>AppID:</strong> ${appid}</p>
            <p><strong>Repository:</strong> ${foundInRepo}</p>
            <p><strong>Files Downloaded:</strong> ${foundFiles.length}</p>
            <p><strong>Total Size:</strong> ${(totalSize / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong>Time Taken:</strong> ${elapsedTime} sec</p>
            <a href="${downloadUrl}" download="${appid}.zip" class="download-link">📥 Download ZIP</a>
        `;

    } catch (err) {
        console.error("Error during ZIP creation or download:", err);
        resultDiv.innerHTML = `<p style="color:red;">❌ An error occurred: ${err.message}</p>`;
    }
}
