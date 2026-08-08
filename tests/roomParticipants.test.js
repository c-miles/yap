// tests/roomParticipants.test.js
import test from "node:test";
import assert from "node:assert/strict";
import {
  upsertParticipant,
  removeParticipant,
  setMediaState,
  listOtherParticipants,
} from "../services/roomParticipants.js";

const participant = {
  userId: "u1",
  socketId: "s1",
  username: "chris",
  profilePicture: "pic.png",
  mediaState: { video: false, audio: true },
};

function fakeModel(script) {
  const calls = [];
  return {
    calls,
    async findOneAndUpdate(filter, update, options) {
      calls.push({ method: "findOneAndUpdate", filter, update, options });
      return script.findOneAndUpdate.shift();
    },
    async updateOne(filter, update) {
      calls.push({ method: "updateOne", filter, update });
      return script.updateOne?.shift() ?? { matchedCount: 1 };
    },
    async findById(id) {
      calls.push({ method: "findById", id });
      return script.findById?.shift() ?? null;
    },
  };
}

test("rejoining user is updated in place and reports 'rejoined'", async () => {
  const model = fakeModel({ findOneAndUpdate: [{ _id: "r1" }] });

  const result = await upsertParticipant(model, "r1", participant);

  assert.equal(result, "rejoined");
  const call = model.calls[0];
  // targeted the existing participant entry...
  assert.deepEqual(call.filter, { _id: "r1", "participants.userId": "u1" });
  // ...and replaced it via the positional operator
  assert.ok(call.update.$set["participants.$"]);
  assert.equal(call.update.$set["participants.$"].socketId, "s1");
});

test("new user is pushed with capacity enforced in the same query", async () => {
  const model = fakeModel({ findOneAndUpdate: [null, { _id: "r1" }] });

  const result = await upsertParticipant(model, "r1", participant);

  assert.equal(result, "joined");
  const push = model.calls[1];
  assert.deepEqual(push.update, { $push: { participants: participant } });
  // capacity guard must live in the FILTER, not a separate read
  assert.deepEqual(push.filter.$expr, {
    $lt: [{ $size: "$participants" }, "$maxParticipants"],
  });
  // same-user exclusion guards against a concurrent duplicate slipping past
  assert.deepEqual(push.filter["participants.userId"], { $ne: "u1" });
});

test("concurrent same-user join converges on rejoined", async () => {
  const model = fakeModel({
    findOneAndUpdate: [null, null, { _id: "r1" }],
  });

  const result = await upsertParticipant(model, "r1", participant);

  assert.equal(result, "rejoined");
  const findOneAndUpdateCalls = model.calls.filter(
    (call) => call.method === "findOneAndUpdate"
  );
  assert.equal(findOneAndUpdateCalls.length, 3);
  assert.equal(model.calls.some((call) => call.method === "findById"), false);
});

test("full room reports 'full' (room exists but guarded push matched nothing)", async () => {
  const model = fakeModel({
    findOneAndUpdate: [null, null, null],
    findById: [{ _id: "r1" }],
  });

  assert.equal(await upsertParticipant(model, "r1", participant), "full");
});

test("missing room reports 'not-found'", async () => {
  const model = fakeModel({
    findOneAndUpdate: [null, null, null],
    findById: [null],
  });

  assert.equal(await upsertParticipant(model, "r1", participant), "not-found");
});

test("removeParticipant pulls only the leaving socket's entry", async () => {
  const model = fakeModel({});

  await removeParticipant(model, "r1", "u1", "s1");

  assert.deepEqual(model.calls[0], {
    method: "updateOne",
    filter: { _id: "r1" },
    update: { $pull: { participants: { userId: "u1", socketId: "s1" } } },
  });
});

test("setMediaState updates exactly one nested field positionally", async () => {
  const model = fakeModel({});

  await setMediaState(model, "r1", "u1", "video", true);

  assert.deepEqual(model.calls[0], {
    method: "updateOne",
    filter: { _id: "r1", "participants.userId": "u1" },
    update: { $set: { "participants.$.mediaState.video": true } },
  });
});

test("setMediaState rejects unknown kinds instead of writing arbitrary paths", async () => {
  const model = fakeModel({});
  await assert.rejects(() => setMediaState(model, "r1", "u1", "screen", true));
  assert.equal(model.calls.length, 0);
});

test("listOtherParticipants excludes the requesting user and trims fields", async () => {
  const model = fakeModel({
    findById: [{
      participants: [
        { userId: "u1", username: "me", profilePicture: "a", mediaState: { video: false, audio: true }, socketId: "s1" },
        { userId: "u2", username: "them", profilePicture: "b", mediaState: { video: true, audio: true }, socketId: "s2" },
      ],
    }],
  });

  const others = await listOtherParticipants(model, "r1", "u1");

  assert.deepEqual(others, [
    { userId: "u2", username: "them", profilePicture: "b", mediaState: { video: true, audio: true } },
  ]);
});

test("listOtherParticipants returns [] for a missing room", async () => {
  const model = fakeModel({ findById: [null] });
  assert.deepEqual(await listOtherParticipants(model, "r1", "u1"), []);
});
