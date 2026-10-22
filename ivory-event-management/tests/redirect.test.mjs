import test from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "../lib/auth/redirect.ts";

test("preserves dashboard paths and query strings", () => {
  assert.equal(safeNext("/dashboard/events?view=calendar"), "/dashboard/events?view=calendar");
});
test("rejects external URLs, path traversal and lookalike routes", () => {
  for (const value of [null, "https://evil.test", "//evil.test", "/dashboard/../../login", "/dashboardish", "/login", "/\\evil.test"]) {
    const result = safeNext(value);
    assert.equal(result, "/dashboard");
    assert.equal(new URL(result, "https://app.invalid").origin, "https://app.invalid");
  }
});
