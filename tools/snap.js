// Builds an audit copy of app/index.html with course-atlas-backup.json preloaded,
// then captures screenshots across desktop, laptop, and mobile viewports using headless Edge.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repo = path.resolve(__dirname, '..');
const scratch = path.resolve('C:\\Users\\hasan\\.gemini\\antigravity\\brain\\573829ed-bf2a-4e04-b7ae-07651468d79f\\scratch');
const out = path.join(scratch, 'shots');
fs.mkdirSync(out, { recursive: true });

const backupPath = path.join(repo, 'course-atlas-backup.json');
const userDataPath = path.join(repo, 'userData', 'atlas-data.json');
const data = fs.existsSync(backupPath)
  ? fs.readFileSync(backupPath, 'utf8')
  : (fs.existsSync(userDataPath) ? fs.readFileSync(userDataPath, 'utf8') : '');

let html = fs.readFileSync(path.join(repo, 'app', 'index.html'), 'utf8');
const theme = process.argv[2] || 'light';
const defaultJobs = 'overview:1920:1080,grid:1920:1080,grid:1366:768,courses:1600:1100,gpa:1600:1200,settings:1600:1100,overview:390:844,grid:390:844';
const jobs = (process.argv[3] || defaultJobs).split(',').filter(Boolean);

const preloadLines = [];
if (data) {
  preloadLines.push(`localStorage.setItem('course-atlas.v1',${JSON.stringify(data)});`);
}
if (theme === 'light' || theme === 'dark') {
  preloadLines.push(`localStorage.setItem('course-atlas.theme',${JSON.stringify(theme)});`);
} else {
  preloadLines.push(`localStorage.removeItem('course-atlas.theme');`);
}
preloadLines.push(`const _vw=location.search.match(/vw=(\\d+)/);if(_vw)document.head.insertAdjacentHTML('beforeend','<style>html,body,.nav,.veil{max-width:'+_vw[1]+'px!important;width:'+_vw[1]+'px!important;right:auto!important;margin-left:0!important}</style>');`);
const inj = `<script>try{${preloadLines.join('')}}catch(e){}</script>`;
html = html.replace('<div id="app"></div>', '<div id="app"></div>' + inj);

const page = path.join(scratch, 'audit-live.html');
fs.writeFileSync(page, html);

const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
let failures = 0;

for (const j of jobs) {
  const [route, w, h] = j.split(':');
  const file = path.join(out, `${theme || 'auto'}-${route}-${w}x${h}.png`);
  const prof = path.join(scratch, `edgeprof-${route}-${w}`);
  try {
    execFileSync(
      edge,
      [
        '--headless=new',
        '--no-sandbox',
        '--hide-scrollbars',
        '--disable-gpu',
        '--no-first-run',
        `--user-data-dir=${prof}`,
        `--window-size=${w},${h}`,
        '--virtual-time-budget=2500',
        `--screenshot=${file}`,
        'file:///' + page.replace(/\\/g, '/') + (+w < 500 ? '?vw=' + w : '') + '#' + route,
      ],
      { stdio: 'inherit', timeout: 30000 }
    );
    console.log('ok', file);
  } catch (e) {
    failures++;
    console.error('fail', j, String(e.message).slice(0, 200));
  }
}

if (failures > 0) process.exit(1);
