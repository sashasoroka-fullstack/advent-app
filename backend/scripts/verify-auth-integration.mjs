/**
 * Verifies API auth wiring. Usage:
 *   node scripts/verify-auth-integration.mjs
 *   ACCESS_TOKEN=<jwt> node scripts/verify-auth-integration.mjs
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const API_BASE = process.env.API_BASE ?? 'http://localhost:3001';
const ISSUER =
  process.env.AUTH_ISSUER ?? 'https://test.identity.leobit.co';
const JWKS_URI = `${ISSUER.replace(/\/+$/, '')}/.well-known/openid-configuration/jwks`;

function loadEnvToken() {
  if (process.env.ACCESS_TOKEN?.trim()) {
    return process.env.ACCESS_TOKEN.trim();
  }
  const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');
  try {
    const raw = readFileSync(envPath, 'utf8');
    const match = raw.match(/^ACCESS_TOKEN=(.+)$/m);
    if (match?.[1]) {
      return match[1].trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // no .env token
  }
  return null;
}

async function request(path, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE}${path}`, { headers });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  const json = Buffer.from(parts[1], 'base64url').toString('utf8');
  return JSON.parse(json);
}

async function main() {
  const results = [];

  const jwksRes = await fetch(JWKS_URI);
  results.push({
    name: 'JWKS reachable',
    ok: jwksRes.ok,
    detail: `${jwksRes.status} ${JWKS_URI}`,
  });

  const noAuth = await request('/quest');
  results.push({
    name: 'GET /quest without token → 401',
    ok: noAuth.status === 401,
    detail: `status ${noAuth.status}`,
  });

  const mock = await request('/quest', 'DEV_MOCK_ACCESS_TOKEN');
  results.push({
    name: 'GET /quest with dev mock token → 401',
    ok: mock.status === 401,
    detail: `status ${mock.status}`,
  });

  const garbage = await request('/quest', 'not.a.jwt');
  results.push({
    name: 'GET /quest with invalid token → 401',
    ok: garbage.status === 401,
    detail: `status ${garbage.status}`,
  });

  const token = loadEnvToken();
  if (token) {
    const payload = decodeJwtPayload(token);
    if (payload) {
      results.push({
        name: 'ACCESS_TOKEN JWT payload (decode only)',
        ok: true,
        detail: JSON.stringify({
          sub: payload.sub,
          email: payload.email,
          aud: payload.aud,
          scope: payload.scope,
          iss: payload.iss,
        }),
      });
    } else {
      results.push({
        name: 'ACCESS_TOKEN looks like opaque token',
        ok: null,
        detail: 'Not a JWT — backend passport-jwt may reject it',
      });
    }
    const api = await request('/quest', token);
    results.push({
      name: 'GET /quest with ACCESS_TOKEN',
      ok: api.status === 200,
      detail: `status ${api.status}${api.status !== 200 ? ` — ${JSON.stringify(api.body)}` : ''}`,
    });
  } else {
    results.push({
      name: 'Real OIDC token test',
      ok: null,
      detail:
        'Skipped — set ACCESS_TOKEN env (paste access_token from browser localStorage oidc.user:…)',
    });
  }

  console.log('\n=== Auth integration check ===\n');
  let failed = 0;
  for (const r of results) {
    const icon = r.ok === true ? 'PASS' : r.ok === false ? 'FAIL' : 'SKIP';
    if (r.ok === false) failed += 1;
    console.log(`[${icon}] ${r.name}`);
    console.log(`       ${r.detail}\n`);
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
