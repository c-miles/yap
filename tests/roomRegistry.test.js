import test from "node:test";
import assert from "node:assert/strict";
import { createRoomRegistry } from "../sockets/roomRegistry.js";

test("join then lookup by socket and by room+user", () => {
  const reg = createRoomRegistry();
  reg.join("sock1", "roomA", "user1");

  assert.equal(reg.getRoom("sock1"), "roomA");
  assert.equal(reg.getUser("sock1"), "user1");
  assert.equal(reg.getSocketId("roomA", "user1"), "sock1");
});

test("leave removes every mapping and reports what was removed", () => {
  const reg = createRoomRegistry();
  reg.join("sock1", "roomA", "user1");

  assert.deepEqual(reg.leave("sock1"), { roomId: "roomA", userId: "user1" });
  assert.equal(reg.getRoom("sock1"), undefined);
  assert.equal(reg.getUser("sock1"), undefined);
  assert.equal(reg.getSocketId("roomA", "user1"), undefined);
});

test("leave for an unknown socket returns null and is harmless", () => {
  const reg = createRoomRegistry();
  assert.equal(reg.leave("ghost"), null);
});

test("same user joining again on a new socket replaces the old mapping", () => {
  const reg = createRoomRegistry();
  reg.join("sockOld", "roomA", "user1");
  const { replacedSocketId } = reg.join("sockNew", "roomA", "user1");

  assert.equal(replacedSocketId, "sockOld");
  assert.equal(reg.getSocketId("roomA", "user1"), "sockNew");
  // the stale socket's own mappings are gone too
  assert.equal(reg.getRoom("sockOld"), undefined);
});

test("first join reports no replaced socket", () => {
  const reg = createRoomRegistry();
  assert.deepEqual(reg.join("sock1", "roomA", "user1"), { replacedSocketId: null });
});

test("users in different rooms do not collide", () => {
  const reg = createRoomRegistry();
  reg.join("sock1", "roomA", "user1");
  reg.join("sock2", "roomB", "user1");

  assert.equal(reg.getSocketId("roomA", "user1"), "sock1");
  assert.equal(reg.getSocketId("roomB", "user1"), "sock2");
});
