document.addEventListener('DOMContentLoaded', () => {
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

        const steamAppUrlPattern = /https?:\/\/store\.steampowered\.com\/app\/(\d+)/i;
        const match = input.match(steamAppUrlPattern);
        let appid = input;

        if (match && match[1]) {
            appid = match[1];
        }

        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = "⏳ Fetching files from repositories...";

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

        for (const { name, repo } of repos) {
            try {
                resultDiv.innerHTML = `🔍 Searching in ${name}...`;
                const githubApiUrl = `https://api.github.com/repos/${repo}/git/trees/${appid}?recursive=1`;

                const treeResponse = await fetch(githubApiUrl);
                if (!treeResponse.ok) {
                    const errorMsg = `Status ${treeResponse.status} (${treeResponse.statusText}) for ${name}`;
                    console.warn(`Could not fetch branch in ${name}:`, errorMsg);
                    fetchErrors.push(`[${name}] ${errorMsg}`);
                    continue;
                }

                const treeData = await treeResponse.json();
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

                let keyVdfFile = files.find(f => f.path.toLowerCase().includes('key.vdf') || f.path.toLowerCase().includes('config.vdf'));
                
                if (!keyVdfFile) {
                    console.warn(`No Key.vdf or config.vdf found in ${repo}/${appid}. Skipping verification.`);
                    foundFiles = files.filter(file => !file.path.includes('.json') && !file.path.includes('key.vdf'));
                    foundInRepo = name;
                    break;
                }

                const keyVdfUrl = `https://raw.githubusercontent.com/${repo}/${appid}/${keyVdfFile.path}`;
                const keyVdfResponse = await fetch(keyVdfUrl);
                if (!keyVdfResponse.ok) {
                    console.warn(`Failed to download ${keyVdfFile.path}`, keyVdfResponse.status);
                    continue;
                }

                const keyVdfText = await keyVdfResponse.text();
                const appIdRegex = new RegExp(`"${appid}"\\s*\\{`);
                if (!appIdRegex.test(keyVdfText)) {
                    console.warn(`AppID ${appid} not found in ${keyVdfFile.path} from ${name}. Likely incorrect branch.`);
                    continue;
                }

                foundFiles = files.filter(file => !file.path.includes('.json') && !file.path.includes('key.vdf'));
                foundInRepo = name;
                resultDiv.innerHTML = `✅ Files found and verified in ${name}. Downloading...`;
                break;

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

            for (const file of foundFiles) {
                const fileUrl = `https://raw.githubusercontent.com/${foundInRepo.replace("Server ", "")}/${appid}/${file.path}`;
                resultDiv.innerHTML = `🔄 Downloading ${file.path}...`;

                const fileResponse = await fetch(fileUrl);
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

    window.generateManifest = generateManifest;
});
