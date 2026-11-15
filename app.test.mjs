import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRelease, RELEASE_ORIGIN, RELEASE_PATH, FALLBACK_URL } from './app.js';
import { renderQr } from './qr.js';

const release = { version_code: 76, version_name: '0.4.0.76', apk_url: `${RELEASE_ORIGIN}${RELEASE_PATH}Hisaab-Qitaab-76.apk`, size_bytes: 9000000, sha256: 'a'.repeat(64), created_at: '2026-10-13T04:04:36Z' };
test('accepts a complete current release without hardcoding its version', () => {
  assert.equal(validateRelease(release).version_code, 76);
  assert.equal(validateRelease({ ...release, version_code: 108, apk_url: `${RELEASE_ORIGIN}${RELEASE_PATH}Hisaab-Qitaab-108.apk` }).version_code, 108);
});
test('rejects external, executable and mismatched release URLs', () => {
  for (const apk_url of ['javascript:alert(1)', 'https://example.com/app.apk', `${RELEASE_ORIGIN}${RELEASE_PATH}Hisaab-Qitaab-75.apk`, release.apk_url + '?redirect=bad']) assert.throws(() => validateRelease({ ...release, apk_url }));
});
test('rejects incomplete or corrupt metadata instead of displaying misleading details', () => {
  for (const change of [{ size_bytes: 0 }, { sha256: 'bad' }, { created_at: 'invalid' }, { version_code: -1 }, { version_name: '' }]) assert.throws(() => validateRelease({ ...release, ...change }));
});
test('fallback remains a stable latest download and QR is generated locally', () => {
  assert.match(FALLBACK_URL, /Hisaab-Qitaab-latest\.apk\?download$/);
  const svg = renderQr('https://hisaab-qitaab-download.lemonyiris8.chatgpt.site/');
  assert.match(svg, /<svg[^>]+viewBox/);
  assert.doesNotMatch(svg, /<script|(?:href|src)=["']https?:/);
});
