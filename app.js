import { renderQr } from './qr.js';

// GitHub Releases public distribution endpoint
export const RELEASE_ORIGIN = 'https://github.com';
export const RELEASE_PATH = '/overthinkercurious/hisaab-qitaab-releases/releases/latest/download/';
export const MANIFEST_URL = 'https://raw.githubusercontent.com/overthinkercurious/hisaab-qitaab-releases/main/latest.json';
export const FALLBACK_URL = RELEASE_ORIGIN + RELEASE_PATH + 'Hisaab-Qitaab-latest.apk?download';

export function validateRelease(data) {
  if (!data || !Number.isSafeInteger(data.version_code) || data.version_code < 1) throw new Error('Invalid release version');
  const url = new URL(data.apk_url);
  if (url.origin !== RELEASE_ORIGIN || url.pathname !== `${RELEASE_PATH}Hisaab-Qitaab-${data.version_code}.apk` || url.search || url.hash) throw new Error('Unexpected APK URL');
  if (!Number.isSafeInteger(data.size_bytes) || data.size_bytes < 1 || !/^[a-f0-9]{64}$/.test(data.sha256)) throw new Error('Missing download verification details');
  if (typeof data.version_name !== 'string' || !data.version_name.trim() || !Number.isFinite(Date.parse(data.created_at))) throw new Error('Invalid release details');
  return data;
}

if (typeof document !== 'undefined') {
  const byId = id => document.getElementById(id);
  let currentRelease;
  let pending = false;
  async function refresh() {
    if (pending) return;
    pending = true;
    try {
      const response = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(12_000) });
      if (!response.ok) throw new Error('Release metadata is unavailable');
      const release = validateRelease(await response.json());
      currentRelease = release;
      byId('download-link').href = release.apk_url + '?download';
      byId('version').textContent = `v${release.version_name}`;
      byId('size').textContent = `${(release.size_bytes / 1024 / 1024).toFixed(1)} MB`;
      byId('release-date').textContent = `v${release.version_name} · ${new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(release.created_at))}`;
      byId('release-notes').textContent = release.release_notes?.trim() || 'No release notes were provided for this build.';
      byId('checksum').textContent = release.sha256;
      byId('technical-meta').textContent = `Build ${release.version_code} · com.hisaabqitaab.app`;
      byId('verification').hidden = false;
      byId('release-status').textContent = 'Latest release checked just now.';
      byId('release-status').classList.remove('error');
    } catch {
      // Never leave an old version pinned when a later refresh fails.
      byId('download-link').href = FALLBACK_URL;
      byId('version').textContent = 'Latest Android release';
      byId('size').textContent = 'APK';
      byId('release-status').textContent = 'Release details are unavailable. The button still opens the latest APK.';
      byId('release-status').classList.add('error');
      byId('release-date').textContent = 'Live release details are temporarily unavailable.';
      byId('release-notes').textContent = 'Please check back shortly for the latest release notes.';
      byId('verification').hidden = true;
    } finally { pending = false; }
  }
  async function copy(button, value, original) {
    try {
      await navigator.clipboard.writeText(value);
      button.textContent = 'Copied!';
      setTimeout(() => { button.textContent = original; }, 2500);
    } catch { button.textContent = 'Copy unavailable in this browser'; }
  }
  const pageUrl = new URL('.', location.href).href;
  const qr = byId('qr-code');
  qr.src = 'data:image/svg+xml,' + encodeURIComponent(renderQr(pageUrl));
  byId('share-link').addEventListener('click', event => copy(event.currentTarget, pageUrl, 'Copy page link ↗'));
  byId('copy-checksum').addEventListener('click', event => { if (currentRelease) copy(event.currentTarget, currentRelease.sha256, 'Copy checksum'); });
  refresh();
  window.addEventListener('pageshow', refresh);
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  setInterval(() => { if (!document.hidden) refresh(); }, 60_000);
}
