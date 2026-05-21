const fs = require('fs');
const path = require('path');

const EOP_DIR = '/Users/paul/Documents/Shared/m1shared/agents/insightmatches internal/18_Funded projects/eop';
const DATA_DIR = path.join(EOP_DIR, 'inc/data');

// 1. Gather all stories
function getStories() {
    const stories = [];
    function crawl(dir) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                crawl(fullPath);
            } else if (file === 'info.json') {
                try {
                    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                    if (data && data.header) {
                        const storyPath = path.dirname(fullPath);
                        const webPath = '/eop' + storyPath.substring(EOP_DIR.length);
                        
                        let oImg = fs.existsSync(path.join(storyPath, "o.webp")) ? "o.webp" : null;
                        
                        stories.push({ data, webPath, files: { o: oImg } });
                    }
                } catch(e) {}
            }
        }
    }
    crawl(DATA_DIR);
    return stories;
}

const stories = getStories();

// 2. Helper to read includes
function readInclude(filename) {
    try {
        return fs.readFileSync(path.join(EOP_DIR, 'inc', filename), 'utf8')
                 .replace(/<\?php[\s\S]*?\?>/g, '') // Remove PHP tags
                 .trim();
    } catch (e) {
        return '';
    }
}

// 3. Build the Cards HTML
let cardsHtml = '';
for (const story of stories) {
    const title = story.data.header.title || '';
    const desc = story.data.header.description || '';
    const imgUrl = `${story.webPath}/${story.files.o}`;
    const detailUrl = `/eop/post/${story.webPath.substring(14)}/index.html`;

    cardsHtml += `
    <div class="card card-full text-black lazy" data-bg="${imgUrl}" data-bg-hidpi="${imgUrl}">
      <div class="card-content p-1 rounded" style="background:rgba(255,255,255,0.5);backdrop-filter: blur(10px);">
        <h3 class="mb-05">${title}</h3>
        <p>${desc}<br></p>
        <p class="mt-05"><a href="${detailUrl}">Details</a></p>
      </div>
    </div>
    `;
}

// 4. Assemble index.html
const indexHtml = `<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Echoes of the Past &mdash; Small Academy</title>
    ${readInclude('inc.html-header2.php')}
    ${readInclude('inc.html-theme.php')}
    
    <style>
      .view-toggle button { margin-right: 5px; cursor: pointer; }
    </style>
  </head>
  <body>
    ${readInclude('inc.body-nav.php')}

    <div id="hero" class="section mt-1">
      ${readInclude('inc.messages.php')}
      <div class="container">
        <h1 class="mb-1">Echoes of the Past</h1>
        <img class="rounded" src="/eop/inc/i/echoes-of-the-past.webp" alt="Echoes of the Past">
        <p class="h2 lead fw-400 mt-1">
          Historical artifacts like postcards are often presented as static images in digital archives, failing 
          to engage users. This format strips away the geographical and narrative context, causing the rich stories 
          behind them to be lost, especially for younger, tech-savvy audiences.
        </p>
      </div>
    </div>

    <div id="projects" class="section">
      <div class="container">
        <div class="row mt-3 items-center justify-between">
          <div class="col-6">
            <h2 class="mb-1 h1">Recent Geostories</h2>
            <p class="mb-1"><a href="/eop/upload/" class="arrow">Add your own story</a></p>
          </div>
          <div class="col-6 text-right">
            <div class="view-toggle btn-group">
              <button id="view-gallery" class="btn btn-sm btn-filled">Gallery View</button>
              <button id="view-map" class="btn btn-sm btn-outline">Map View</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Map Container (Hidden by default) -->
      <div id="map-container" class="mt-2" style="display:none; height: 600px; width: 100%; position: relative;">
        <iframe src="/eop/map/index.html" style="width:100%; height:100%; border:none; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"></iframe>
      </div>

      <!-- Gallery View -->
      <div id="gallery-container">
        <div class="container-cards pt-2 pb-2" id="cards-with-activities">
          ${cardsHtml}
        </div>
        <div class="text-right mt-1 mb-1">
          <button class="btn-icon arrow-left op-0 mr-05" data-target="cards-with-activities" id="arrow-left-cards-with-activities" title="Scroll to left"><i class="bi bi-chevron-left"></i></button>
          <button class="btn-icon arrow-right op-0" data-target="cards-with-activities" id="arrow-right-cards-with-activities" title="Scroll to right"><i class="bi bi-chevron-right"></i></button>
        </div>
      </div>
    </div>

    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const galleryBtn = document.getElementById('view-gallery');
        const mapBtn = document.getElementById('view-map');
        const galleryCont = document.getElementById('gallery-container');
        const mapCont = document.getElementById('map-container');

        if(galleryBtn && mapBtn) {
            galleryBtn.addEventListener('click', function() {
              galleryCont.style.display = 'block';
              mapCont.style.display = 'none';
              galleryBtn.classList.add('btn-filled');
              galleryBtn.classList.remove('btn-outline');
              mapBtn.classList.add('btn-outline');
              mapBtn.classList.remove('btn-filled');
            });

            mapBtn.addEventListener('click', function() {
              galleryCont.style.display = 'none';
              mapCont.style.display = 'block';
              mapBtn.classList.add('btn-filled');
              mapBtn.classList.remove('btn-outline');
              galleryBtn.classList.add('btn-outline');
              galleryBtn.classList.remove('btn-filled');
            });
        }
      });
    </script>

    ${readInclude('inc.cta.php')}
    ${readInclude('inc.body-footer.php')}
    ${readInclude('inc.body-gtag.php')}
    ${readInclude('inc.body-scripts.php')}
  </body>
</html>`;

fs.writeFileSync(path.join(EOP_DIR, 'index.html'), indexHtml);
console.log('Successfully compiled index.html');
