import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { safeNext } from '../lib/auth/redirect.ts';
const require = createRequire(import.meta.url);
const { NextRequest } = require('next/server');
const source = ts.transpileModule(fs.readFileSync(new URL('../middleware.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;

function loadMiddleware(user) {
  const exported = {};
  vm.runInNewContext(source, {
    exports: exported,
    require(name) {
      if (name === '@supabase/ssr') return { createServerClient(url, key, options) {
        return { auth: { async getUser() {
          options.cookies.setAll([
            { name: 'refreshed-session', value: 'new-token', options: { httpOnly: true, path: '/' } },
            { name: 'expired-session', value: '', options: { maxAge: 0, path: '/' } },
          ], { 'Cache-Control': 'private, no-store' });
          return { data: { user }, error: null };
        } } };
      } };
      if (name === '@/lib/supabase/config') return { supabaseConfig: () => ({ url: 'https://example.supabase.co', key: 'test' }) };
      if (name === '@/lib/auth/redirect') return { safeNext };
      return require(name);
    }, URL,
  });
  return exported.middleware;
}

test('login redirects retain refreshed and cleared cookies', async () => {
  const request = new NextRequest('https://app.test/dashboard/events?tab=all');
  const response = await loadMiddleware(null)(request);
  assert.equal(response.status, 307);
  assert.equal(response.cookies.get('refreshed-session').value, 'new-token');
  assert.equal(response.cookies.get('expired-session').maxAge, 0);
  assert.equal(request.cookies.get('refreshed-session').value, 'new-token');
  assert.match(response.headers.get('Cache-Control'), /no-store/);
});
test('signed-in login redirects preserve cookies and reject external destinations', async () => {
  const response = await loadMiddleware({ id: 'verified-user' })(new NextRequest('https://app.test/login?next=https://evil.test'));
  assert.equal(response.headers.get('location'), 'https://app.test/dashboard');
  assert.equal(response.cookies.get('refreshed-session').value, 'new-token');
});
test('verified users can continue to protected routes', async () => {
  const response = await loadMiddleware({ id: 'verified-user' })(new NextRequest('https://app.test/dashboard'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('location'), null);
  assert.equal(response.cookies.get('refreshed-session').value, 'new-token');
});
