import test from "node:test";
import assert from "node:assert/strict";
import { localToUtc, localDateTime, parseEvent, isUuid } from "../lib/events/input.ts";

test("event times use the selected zone including half-hour offsets", () => {
  assert.equal(localToUtc("2026-12-01T18:00", "Asia/Bangkok"), "2026-12-01T11:00:00.000Z");
  assert.equal(localToUtc("2026-12-01T18:00", "Asia/Kolkata"), "2026-12-01T12:30:00.000Z");
  assert.equal(localToUtc("2026-12-01T00:00", "UTC"), "2026-12-01T00:00:00.000Z");
  assert.equal(localToUtc("2026-07-01T12:00", "America/New_York"), "2026-07-01T16:00:00.000Z");
});
test("invalid dates, unsupported zones, and DST gaps/folds are rejected", () => {
  for (const [local, zone] of [["2026-02-30T12:00", "UTC"], ["2026-12-01T12:00", "bogus"], ["2026-03-08T02:30", "America/New_York"], ["2026-11-01T01:30", "America/New_York"], ["", "UTC"]]) {
    assert.throws(() => localToUtc(local, zone), /date/);
  }
});
const form = (values = {}) => {
  const result = new FormData();
  for (const [key, value] of Object.entries({ name: "Wedding", event_type: "wedding", time_zone: "Asia/Bangkok", starts_at: "2026-12-01T18:00", ...values })) result.set(key, value);
  return result;
};
test("event input normalizes blanks and rejects reversed or equal end times", () => {
  const event = parseEvent(form({ name: "  Our wedding  ", venue: "   " }));
  assert.equal(event.name, "Our wedding");
  assert.equal(event.venue, null);
  assert.equal(event.ends_at, null);
  assert.throws(() => parseEvent(form({ ends_at: "2026-12-01T17:00" })), /end/);
  assert.throws(() => parseEvent(form({ ends_at: "2026-12-01T18:00" })), /end/);
  assert.equal(parseEvent(form({ ends_at: "2026-12-02T01:00" })).ends_at, "2026-12-01T18:00:00.000Z");
});
test("event input enforces lengths, type and ID format", () => {
  for (const values of [{ name: " " }, { name: "x".repeat(121) }, { notes: "x".repeat(4001) }, { event_type: "unexpected" }]) assert.throws(() => parseEvent(form(values)), /fields/);
  assert.equal(isUuid("invalid"), false);
  assert.equal(isUuid("00000000-0000-0000-0000-000000000001"), true);
});

test("edit forms round-trip saved dates in the event zone across midnight and DST", () => {
  for (const [instant, zone] of [["2026-12-01T20:30:00.000Z", "Asia/Bangkok"], ["2026-07-01T16:00:00.000Z", "America/New_York"], ["2026-12-01T18:30:00.000Z", "Asia/Kolkata"]]) {
    assert.equal(localToUtc(localDateTime(instant, zone), zone), instant);
  }
  assert.equal(localDateTime("2026-12-01T20:30:00Z", "Asia/Bangkok"), "2026-12-02T03:30");
  assert.equal(localDateTime(null, "Asia/Bangkok"), "");
});
