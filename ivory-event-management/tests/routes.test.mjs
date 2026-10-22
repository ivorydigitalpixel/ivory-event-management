import test from "node:test";
import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL;
const get = (path, options = {}) => fetch(new URL(path, base), { redirect: "manual", ...options });

test("public home and login remain available", { skip: !base }, async () => {
  for (const path of ["/", "/login"]) assert.equal((await get(path)).status, 200);
});
test("anonymous dashboard and nested routes preserve their destination", { skip: !base }, async () => {
  for (const path of ["/dashboard", "/dashboard/events?view=calendar", "/dashboard/events/photo.png", "/dashboard/workspaces/00000000-0000-0000-0000-000000000001/new", "/dashboard/workspaces/00000000-0000-0000-0000-000000000001/events/00000000-0000-0000-0000-000000000002"]) {
    const response = await get(path);
    assert.equal(response.status, 307);
    const location = new URL(response.headers.get("location"), base);
    assert.equal(location.pathname, "/login");
    assert.equal(location.searchParams.get("next"), path);
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
});
test("new app routes are private and APIs return 401", { skip: !base }, async () => {
  assert.equal((await get("/workspaces")).status, 307);
  const response = await get("/api/events");
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Authentication required" });
});
test("invalid confirmation links fail safely without following external redirects", { skip: !base }, async () => {
  for (const path of ["/auth/callback?next=https://evil.test", "/auth/confirm?type=recovery&token_hash=invalid&next=//evil.test"]) {
    const response = await get(path);
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get("location"), base).pathname, "/login");
    assert.equal(new URL(response.headers.get("location"), base).searchParams.get("error"), "confirmation");
  }
});
test("a fabricated session cannot open the dashboard", { skip: !base }, async () => {
  const payload = Buffer.from(JSON.stringify({ access_token: "forged-token", refresh_token: "invalid-refresh", expires_at: 9999999999, user: { id: "forged-user" } })).toString("base64url");
  const response = await get("/dashboard", { headers: { cookie: "sb-vgtcvmjjwwqeagjfonnw-auth-token=base64-" + payload } });
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location"), base).pathname, "/login");
});
