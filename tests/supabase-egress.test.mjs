import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contextSource = readFileSync(new URL('../src/context/ClubContext.tsx', import.meta.url), 'utf8');

test('bulk player hydration never selects KYC image columns', () => {
  const hydrationQuery = contextSource.match(
    /client\.from\('players'\)\.select\('([^']+)'\)\.order\('created_at'/,
  );
  assert.ok(hydrationQuery, 'expected the player hydration query to exist');
  assert.doesNotMatch(hydrationQuery[1], /(?:aadhaar|pan|photo)_.*url|photo_url/);
});

test('KYC documents have only a single-player on-demand read path', () => {
  const imageSelects = contextSource.match(
    /\.select\('id,aadhaar_number,pan_number,govt_id_number,aadhaar_photo_url,aadhaar_back_photo_url,pan_photo_url,photo_url'\)/g,
  ) ?? [];
  assert.equal(imageSelects.length, 1);
  assert.match(contextSource, /\.eq\('id', playerId\)\s*\.limit\(1\)/);
  assert.doesNotMatch(contextSource, /fetchMultiplePlayerKycDocs/);
});

test('player realtime avoids image-heavy insert and update payloads', () => {
  assert.match(
    contextSource,
    /\{ event: 'DELETE', schema: 'public', table: 'players' \}/,
  );
  assert.doesNotMatch(
    contextSource,
    /\{ event: '\*', schema: 'public', table: 'players' \}/,
  );
});

test('repeat hydration is guarded by the session cache', () => {
  assert.match(contextSource, /SUPABASE_HYDRATION_CACHE_MS = 5 \* 60 \* 1000/);
  assert.match(contextSource, /sessionStorage\.getItem\(SUPABASE_HYDRATION_CACHE_KEY\)/);
});
