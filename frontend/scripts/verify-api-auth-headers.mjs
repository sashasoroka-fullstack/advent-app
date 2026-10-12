/**
 * Simulates authToken + client header merge (no browser).
 */
function getApiAuthHeaders(getter) {
  const fromGetter = getter?.() ?? null;
  const token = fromGetter ?? null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function readOidcAccessTokenFromStorage(entries, authority, clientId) {
  const key = `oidc.user:${authority}:${clientId}`;
  const raw = entries.find(([entryKey]) => entryKey === key)?.[1];
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.access_token === 'string' && parsed.access_token.length > 0) {
      return parsed.access_token;
    }
  } catch {
    return null;
  }
  return null;
}

const cases = [
  {
    name: 'ApiAuthSync getter (OIDC user)',
    getter: () => 'eyJ-test-access-token',
    storage: [],
    expectAuth: true,
  },
  {
    name: 'localStorage fallback',
    getter: null,
    storage: [
      [
        'oidc.user:https://test.identity.leobit.co:leobit.quest.web',
        JSON.stringify({ access_token: 'stored-access-token' }),
      ],
    ],
    expectAuth: true,
  },
  {
    name: 'no session',
    getter: null,
    storage: [],
    expectAuth: false,
  },
];

let failed = 0;
console.log('\n=== Frontend API auth headers ===\n');
for (const c of cases) {
  let getter = c.getter;
  if (!getter && c.storage.length > 0) {
    const token = readOidcAccessTokenFromStorage(
      c.storage,
      'https://test.identity.leobit.co',
      'leobit.quest.web',
    );
    getter = () => token;
  }
  const headers = getApiAuthHeaders(getter);
  const hasAuth = Boolean(headers.Authorization?.startsWith('Bearer '));
  const ok = hasAuth === c.expectAuth;
  if (!ok) failed += 1;
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${c.name}`);
  console.log(`       headers: ${JSON.stringify(headers)}\n`);
}
process.exit(failed > 0 ? 1 : 0);
