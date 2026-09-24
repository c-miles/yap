import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRequestedHeight } from "../services/videoRequests.js";

test("passes through and rounds real heights", () => {
  assert.equal(normalizeRequestedHeight(540), 540);
  assert.equal(normalizeRequestedHeight(539.6), 540);
  assert.equal(normalizeRequestedHeight(0), 0);
});

test("clamps out-of-range heights", () => {
  assert.equal(normalizeRequestedHeight(-10), 0);
  assert.equal(normalizeRequestedHeight(99999), 2160);
});

test("drops anything that isn't a number", () => {
  for (const value of ["720", NaN, Infinity, undefined, null, {}]) {
    assert.equal(normalizeRequestedHeight(value), null);
  }
});
