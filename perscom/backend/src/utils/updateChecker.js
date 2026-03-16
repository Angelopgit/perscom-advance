'use strict';

// Points to the actual repo where releases are published
const RELEASES_URL = 'https://api.github.com/repos/Angelopgit/perscom-advance/releases/latest';

async function checkForUpdates() {
  try {
    let currentVersion = '1.0.0';
    try { currentVersion = require('../package.json').version; } catch {}

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(RELEASES_URL, {
      headers: { 'User-Agent': 'PERSCOM-Advance-UpdateChecker' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return;

    const data = await res.json();
    const latestVersion = (data.tag_name || '').replace(/^v/, '');

    if (!latestVersion || latestVersion === currentVersion) return;

    const [curMaj, curMin, curPatch] = currentVersion.split('.').map(Number);
    const [latMaj, latMin, latPatch] = latestVersion.split('.').map(Number);

    const isNewer =
      latMaj > curMaj ||
      (latMaj === curMaj && latMin > curMin) ||
      (latMaj === curMaj && latMin === curMin && latPatch > curPatch);

    if (isNewer) {
      console.log('');
      console.log('┌──────────────────────────────────────────────┐');
      console.log('│   ⬆  PERSCOM Advance Update Available         │');
      console.log(`│   Current: v${currentVersion.padEnd(10)}  Latest: v${latestVersion.padEnd(9)} │`);
      console.log('│   Run: git pull && npm install               │');
      console.log('│   Then: cd ../frontend && npm run build      │');
      console.log('│   Then: restart the server                   │');
      console.log('└──────────────────────────────────────────────┘');
      console.log('');
    }
  } catch {
    // Update check is non-critical — silently ignore all errors
  }
}

module.exports = { checkForUpdates };
