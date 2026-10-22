import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { isUuid, parseEvent } from "../lib/events/input.ts";

const org = "00000000-0000-0000-0000-000000000001";
const stop = destination => { throw new Error(destination); };
function load(path, imports) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(source, { exports, require: name => { if (!(name in imports)) throw new Error(name); return imports[name]; }, Error });
  return exports;
}
function access({ signedIn = true, member = { role: "owner" }, status = "active" } = {}) {
  const filters = [];
  const supabase = { auth: { getUser: async () => ({ data: { user: signedIn ? { id: "verified-user" } : null }, error: null }) }, from(table) {
    const query = { select() { return query; }, eq(key, value) { filters.push([table, key, value]); return query; }, async maybeSingle() { return { data: table === "organization_members" ? member : { id: org, name: "Workspace", status }, error: null }; } };
    return query;
  } };
  return { filters, run: load("../lib/events/access.ts", { "next/navigation": { redirect: stop, notFound: () => stop("404") }, "@/lib/supabase/server": { createClient: () => supabase }, "./input": { isUuid } }).workspaceAccess };
}
test("workspace checks reject signed-out users, invalid IDs, nonmembers and inactive workspaces", async () => {
  await assert.rejects(access({ signedIn: false }).run(org), /login/);
  await assert.rejects(access().run("bad-id"), /404/);
  await assert.rejects(access({ member: null }).run(org), /404/);
  await assert.rejects(access({ status: "suspended" }).run(org), /404/);
});
test("workspace membership is tied to verified user and active status; creation excludes team roles", async () => {
  const fixture = access();
  assert.equal((await fixture.run(org)).canCreate, true);
  assert.ok(fixture.filters.some(([table, key, value]) => table === "organization_members" && key === "user_id" && value === "verified-user"));
  assert.ok(fixture.filters.some(([table, key, value]) => table === "organization_members" && key === "status" && value === "active"));
  for (const role of ["project_manager", "team_member"]) assert.equal((await access({ member: { role } }).run(org)).canCreate, false);
});
function action(canCreate, fail = false) {
  const writes = [];
  const supabase = { from(table) { return { async insert(values) { writes.push({ table, values }); return { error: fail ? {} : null }; } }; } };
  const run = load("../app/dashboard/workspaces/[organizationId]/actions.ts", {
    "node:crypto": { randomUUID: () => "new-event" }, "next/navigation": { redirect: stop }, "next/cache": { revalidatePath() {} },
    "@/lib/events/access": { workspaceAccess: async () => ({ supabase, user: { id: "verified-user" }, canCreate }) },
    "@/lib/events/input": { parseEvent },
  }).createEvent;
  return { run, writes };
}
function form() {
  const f = new FormData();
  for (const [key, value] of Object.entries({ name: "Wedding", event_type: "wedding", time_zone: "Asia/Bangkok", starts_at: "2026-12-01T18:00", organization_id: "forged-org", created_by: "forged-user", status: "confirmed" })) f.set(key, value);
  return f;
}
test("server action blocks unsupported roles and invalid input before writing", async () => {
  const denied = action(false);
  assert.match((await denied.run(org, {}, form())).error, /owners and admins/);
  assert.equal(denied.writes.length, 0);
  const invalid = action(true), f = form(); f.set("name", "");
  assert.ok((await invalid.run(org, {}, f)).error);
  assert.equal(invalid.writes.length, 0);
});
test("server action uses verified identity and workspace, ignores privileged form fields, and handles save failures", async () => {
  const fixture = action(true);
  await assert.rejects(fixture.run(org, {}, form()), /events\/new-event/);
  assert.equal(fixture.writes[0].values.organization_id, org);
  assert.equal(fixture.writes[0].values.created_by, "verified-user");
  assert.equal(fixture.writes[0].values.status, "draft");
  assert.match((await action(true, true).run(org, {}, form())).error, /Unable to save/);
});
