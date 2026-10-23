import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { isUuid, parseEvent, eventStatuses } from "../lib/events/input.ts";

const org = "00000000-0000-0000-0000-000000000001";
const stop = destination => { throw new Error(destination); };
function load(path, imports) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(source, { exports, require: name => { if (!(name in imports)) throw new Error(name); return imports[name]; }, Error });
  return exports;
}
function access({ signedIn = true, member = { role: "owner" }, status = "active", visibleEvent = { id: org } } = {}) {
  const filters = [];
  const supabase = { auth: { getUser: async () => ({ data: { user: signedIn ? { id: "verified-user" } : null }, error: null }) }, from(table) {
    const query = { select() { return query; }, eq(key, value) { filters.push([table, key, value]); return query; }, async maybeSingle() { return { data: table === "organization_members" ? member : table === "events" ? visibleEvent : { id: org, name: "Workspace", status }, error: null }; } };
    return query;
  } };
  const module = load("../lib/events/access.ts", { "next/navigation": { redirect: stop, notFound: () => stop("404") }, "@/lib/supabase/server": { createClient: () => supabase }, "./input": { isUuid } });
  return { filters, run: module.workspaceAccess, event: module.eventAccess };
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
function action(canCreate, fail = false, archived = false, missing = false) {
  const writes = [], filters = [];
  const supabase = { from(table) { return {
    async insert(values) { writes.push({ table, values }); return { error: fail ? {} : null }; },
    update(values) {
      writes.push({ table, values });
      const query = { eq(key, value) { filters.push([key, value]); return query; }, is(key, value) { filters.push([key, value]); return query; }, not(key, operator, value) { filters.push([key, operator, value]); return query; }, select() { return query; }, async maybeSingle() { return { data: missing ? null : { id: "event" }, error: fail ? {} : null }; } };
      return query;
    },
  }; } };
  const module = load("../app/dashboard/workspaces/[organizationId]/actions.ts", {
    "node:crypto": { randomUUID: () => "new-event" }, "next/navigation": { redirect: stop }, "next/cache": { revalidatePath() {} },
    "@/lib/events/access": { workspaceAccess: async () => ({ supabase, user: { id: "verified-user" }, canCreate }), eventAccess: async () => ({ supabase, canManage: canCreate, event: { archived_at: archived ? "2026-01-01T00:00:00Z" : null } }) },
    "@/lib/events/input": { parseEvent, eventStatuses },
  });
  return { run: module.createEvent, update: module.updateEvent, archive: module.setEventArchive, writes, filters };
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

test("event access rejects invisible events and scopes lookups to the workspace and event ID", async () => {
  const event = "00000000-0000-0000-0000-000000000002";
  await assert.rejects(access({ visibleEvent: null }).event(org, event), /404/);
  await assert.rejects(access().event(org, "invalid"), /404/);
  const fixture = access({ member: { role: "project_manager" } });
  assert.equal((await fixture.event(org, event)).canManage, true);
  assert.ok(fixture.filters.some(([table, key, value]) => table === "events" && key === "organization_id" && value === org));
  assert.ok(fixture.filters.some(([table, key, value]) => table === "events" && key === "id" && value === event));
  assert.equal((await access({ member: { role: "team_member" } }).event(org, event)).canManage, false);
});

test("edits reject unauthorized users, archived events, invalid status, and missing rows", async () => {
  const denied = action(false);
  assert.match((await denied.update(org, "event", {}, form())).error, /permission/);
  assert.equal(denied.writes.length, 0);
  assert.match((await action(true, false, true).update(org, "event", {}, form())).error, /Restore/);
  const invalid = form(); invalid.set("status", "invented");
  const fixture = action(true);
  assert.match((await fixture.update(org, "event", {}, invalid)).error, /status/);
  assert.equal(fixture.writes.length, 0);
  assert.match((await action(true, false, false, true).update(org, "event", {}, form())).error, /Unable to update/);
});

test("edits ignore ownership and tenant fields and scope updates to the verified event", async () => {
  const fixture = action(true);
  await assert.rejects(fixture.update(org, "event", {}, form()), /saved=1/);
  const values = fixture.writes[0].values;
  assert.equal(values.organization_id, undefined);
  assert.equal(values.created_by, undefined);
  assert.equal(values.status, "confirmed");
  assert.ok(fixture.filters.some(([key, value]) => key === "organization_id" && value === org));
  assert.ok(fixture.filters.some(([key, value]) => key === "id" && value === "event"));
});

const operation = value => { const f = new FormData(); f.set("operation", value); return f; };
test("archiving and restoring enforce permissions, state, scope, and successful writes", async () => {
  const denied = action(false);
  assert.match((await denied.archive(org, "event", {}, operation("archive"))).error, /permission/);
  assert.equal(denied.writes.length, 0);
  assert.match((await action(true).archive(org, "event", {}, operation("delete"))).error, /Choose/);
  assert.match((await action(true, false, true).archive(org, "event", {}, operation("archive"))).error, /changed/);
  assert.match((await action(true, false, false, true).archive(org, "event", {}, operation("archive"))).error, /Unable/);
  const archived = action(true);
  await assert.rejects(archived.archive(org, "event", {}, operation("archive")), /archived=1/);
  assert.ok(archived.writes[0].values.archived_at);
  assert.ok(archived.filters.some(([key, value]) => key === "organization_id" && value === org));
  assert.ok(archived.filters.some(([key, value]) => key === "id" && value === "event"));
  const restored = action(true, false, true);
  await assert.rejects(restored.archive(org, "event", {}, operation("restore")), /restored=1/);
  assert.equal(restored.writes[0].values.archived_at, null);
});
