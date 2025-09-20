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

// --- Main Manifest Generation Logic ---
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

    // Menggunakan nama "Server" yang lebih ramah pengguna
    const repos = [
        { name: "Server 1", repo: "SteamAutoCracks/ManifestHub" },
        { name: "Server 2", repo: "ikun0014/ManifestHub" },
        { name: "Server 3", repo: "Auiowu/ManifestAutoUpdate" },
        { name: "Server 4", repo: "tymolu233/ManifestAutoUpdate-fix" }
    ];

    let foundFiles = [];
    let foundInRepo = "";
    let totalSize = 0;
    let fetchErrors = [];

    // URL Google Apps Script proxy
    const gasProxyUrl = 'https://script.google.com/macros/s/AKfycbwbpNydmN18Iw5K5rRgiM8t2InELIs1qla4vAovESftAgO6DnBFY4D_KWeH662eadzfPw/exec';

    for (const { name, repo } of repos) {
        try {
            resultDiv.innerHTML = `🔍 Searching in ${name}...`;
            
            // Gunakan GAS proxy untuk mendapatkan tree
            const treeResponse = await fetch(gasProxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    type: 'tree',
                    repo: repo,
                    branch: appid,
                    recursive: 1
                })
            });

            if (!treeResponse.ok) {
                const errorMsg = `Status ${treeResponse.status} (${treeResponse.statusText}) for ${name}`;
                console.warn(`Could not fetch branch in ${name}:`, errorMsg);
                fetchErrors.push(`[${name}] ${errorMsg}`);
                continue;
            }

            const treeData = await treeResponse.json();
            
            // Handle jika GAS mengembalikan error dari GitHub
            if (treeData.error) {
                const errorMsg = `GitHub API Error: ${treeData.error}`;
                console.warn(errorMsg);
                fetchErrors.push(`[${name}] ${errorMsg}`);
                continue;
            }

            if (!treeData.tree) {
                const errorMsg = `Invalid response structure from ${name}`;
                console.warn(errorMsg);
                fetchErrors.push(`[${name}] ${errorMsg}`);
                continue;
            }

            const files = treeData.tree.filter(file => file.type === 'blob');

            if (files.length === 0) {
                const errorMsg = `No files found in branch '${appid}' in ${name}`;
                console.warn(errorMsg);
                fetchErrors.push(`[${name}] ${errorMsg}`);
                continue;
            }

            // --- Pemeriksaan Baru: Cari Key.vdf dan verifikasi AppID ---
            let keyVdfFile = files.find(f => f.path.toLowerCase().includes('key.vdf') || f.path.toLowerCase().includes('config.vdf'));
            
            if (!keyVdfFile) {
                console.warn(`No Key.vdf or config.vdf found in ${repo}/${appid}. Skipping verification.`);
                // TAPI tetap filter file yang tidak diinginkan
                foundFiles = files.filter(file => 
                    !file.path.toLowerCase().endsWith('.json') && 
                    !file.path.toLowerCase().includes('key.vdf') &&
                    !file.path.toLowerCase().includes('config.vdf')
                );
                foundInRepo = name;
                break;
            }

            // Unduh dan baca isi Key.vdf melalui GAS proxy
            const keyVdfResponse = await fetch(gasProxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    type: 'file',
                    repo: repo,
                    branch: appid,
                    path: keyVdfFile.path
                })
            });

            if (!keyVdfResponse.ok) {
                console.warn(`Failed to download ${keyVdfFile.path}`, keyVdfResponse.status);
                continue;
            }

            const keyVdfText = await keyVdfResponse.text();
            // Gunakan regex sederhana untuk mencari AppID di teks VDF
            const appIdRegex = new RegExp(`"${appid}"\\s*\\{`);
            if (!appIdRegex.test(keyVdfText)) {
                console.warn(`AppID ${appid} not found in ${keyVdfFile.path} from ${name}. Likely incorrect branch.`);
                continue;
            }

            // Jika lolos verifikasi, gunakan file dari branch ini
            // TAPI filter file yang tidak diinginkan
            foundFiles = files.filter(file => 
                !file.path.toLowerCase().endsWith('.json') && 
                !file.path.toLowerCase().includes('key.vdf') &&
                !file.path.toLowerCase().includes('config.vdf')
            );
            foundInRepo = name;
            resultDiv.innerHTML = `✅ Files found and verified in ${name}. Downloading...`;
            break; // Keluar dari loop

        } catch (err) {
            const errorMsg = `Network or processing error for ${name}: ${err.message}`;
            console.error(errorMsg, err);
            fetchErrors.push(`[${name}] ${errorMsg}`);
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
            resultDiv.innerHTML = `🔄 Downloading ${file.path}...`;
            
            // Unduh file melalui GAS proxy
            const fileResponse = await fetch(gasProxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    type: 'file',
                    repo: repos.find(r => r.name === foundInRepo).repo,
                    branch: appid,
                    path: file.path
                })
            });

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

        // Tambahkan README.txt dengan informasi kredit
        const readmeContent = `
# Credits & Support

**Website:** https://steamclouds.online/      
**Discord:** https://discord.gg/Qsp6Sbq6wy      
**YouTube:** https://youtube.com/@smart_mods      

💖 Your support keeps innovation alive and helps me bring you even better tools. 💖

**Donations:**  
- Saweria: https://saweria.co/R3verseNinja      
- Ko-Fi: https://ko-fi.com/r3verseninja      
- PayPal: https://paypal.me/steamclouds      

SMART HUBS
`;
        zip.file("README.txt", readmeContent);

        const finalZipBlob = await zip.generateAsync({ type: "blob" });
        const downloadUrl = URL.createObjectURL(finalZipBlob);
        const elapsedTime = ((performance.now() - startTime) / 1000).toFixed(2);

        resultDiv.innerHTML = `
            <h2>✅ Manifest Ready</h2>
            <p><strong>AppID:</strong> ${appid}</p>
            <p><strong>Server:</strong> ${foundInRepo}</p>
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

