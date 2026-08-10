import test from "node:test";
import assert from "node:assert/strict";
import { createRequireAuthApi } from "../middleware/requireAuthApi.js";

function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

test("rejects requests with no authenticated user", () => {
  const middleware = createRequireAuthApi(() => ({ userId: null }));
  const res = fakeRes();
  let called = false;
  middleware({}, res, () => { called = true; });
  assert.equal(called, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: "Unauthorized" });
});

test("passes authenticated requests through untouched", () => {
  const middleware = createRequireAuthApi(() => ({ userId: "user_1" }));
  const res = fakeRes();
  let called = false;
  middleware({}, res, () => { called = true; });
  assert.equal(called, true);
  assert.equal(res.statusCode, null);
});
