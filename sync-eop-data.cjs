const fs = require('fs');
const path = require('path');

const EOP_DATA_DIR = '/Users/paul/Documents/Shared/m1shared/agents/insightmatches internal/18_Funded projects/eop/inc/data/';
const REACT_PUBLIC_DIR = path.join(__dirname, 'public');
const OUTPUT_FILE = path.join(REACT_PUBLIC_DIR, 'eop-postcards.json');
const IMAGES_DIR = path.join(REACT_PUBLIC_DIR, 'eop-images');

// Create images directory if it doesn't exist
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

function crawl(dir, results = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            crawl(fullPath, results);
        } else if (file === 'info.json') {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const data = JSON.parse(content);
                if (data && data.header) {
                    const storyPath = path.dirname(fullPath);
                    const id = data.header.postcard_id || Math.random().toString(36).substr(2, 9);
                    
                    let originalImgPath = "";
                    let ext = "";
                    if (fs.existsSync(path.join(storyPath, "o.webp"))) { originalImgPath = path.join(storyPath, "o.webp"); ext = "webp"; }
                    else if (fs.existsSync(path.join(storyPath, "i.png"))) { originalImgPath = path.join(storyPath, "i.png"); ext = "png"; }
                    else if (fs.existsSync(path.join(storyPath, "c.png"))) { originalImgPath = path.join(storyPath, "c.png"); ext = "png"; }

                    let relativeImgUrl = "";
                    if (originalImgPath) {
                        const newImgName = `${id}.${ext}`;
                        const targetImgPath = path.join(IMAGES_DIR, newImgName);
                        fs.copyFileSync(originalImgPath, targetImgPath);
                        relativeImgUrl = `/eop-images/${newImgName}`;
                    }

                    let lat = 0, lng = 0;
                    if (data.scene && data.scene[0] && data.scene[0].location && data.scene[0].location.geolocation) {
                        lat = data.scene[0].location.geolocation.latitude;
                        lng = data.scene[0].location.geolocation.longitude;
                    }

                    results.push({
                        id: id,
                        title: data.header.title || "Untitled",
                        description: data.header.description || "",
                        latitude: parseFloat(lat),
                        longitude: parseFloat(lng),
                        imageUrl: relativeImgUrl,
                        detailUrl: "#" 
                    });
                }
            } catch (e) {
                console.error(`Error parsing ${fullPath}:`, e);
            }
        }
    }
    return results;
}

console.log("Crawling EOP data and copying images...");
const postcards = crawl(EOP_DATA_DIR);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(postcards, null, 2));
console.log(`Successfully generated ${postcards.length} postcards and synced images.`);
