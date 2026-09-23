import test from "node:test";
import assert from "node:assert/strict";
import { findRoom } from "../services/roomLookup.js";

function fakeModel() {
  const filters = [];
  return {
    filters,
    async findOne(filter) {
      filters.push(filter);
      return null;
    },
  };
}

test("looks a room id up by _id", async () => {
  const model = fakeModel();
  await findRoom(model, "507f1f77bcf86cd799439011");
  assert.deepEqual(model.filters, [{ _id: "507f1f77bcf86cd799439011" }]);
});

test("looks anything else up by friendly name", async () => {
  const model = fakeModel();
  await findRoom(model, "jolly-red-fox");
  assert.deepEqual(model.filters, [{ friendlyName: "jolly-red-fox" }]);
});

test("doesn't mistake a short hex-looking name for an id", async () => {
  const model = fakeModel();
  await findRoom(model, "abcdefabcdef");
  assert.deepEqual(model.filters, [{ friendlyName: "abcdefabcdef" }]);
});
