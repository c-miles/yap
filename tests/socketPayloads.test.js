import test from "node:test";
import assert from "node:assert/strict";
import { socketEvents } from "../sockets/socketEvents.js";

function connect() {
  const handlers = new Map();
  const socket = {
    id: "s1",
    on: (event, handler) => handlers.set(event, handler),
    to: () => ({ emit() {} }),
    emit() {},
    join() {},
    leave() {},
  };
  const io = {
    on: (event, handler) => event === "connection" && handler(socket),
    to: () => ({ emit() {} }),
  };
  socketEvents(io);
  return handlers;
}

test("events sent without a payload are ignored instead of crashing the server", async () => {
  const handlers = connect();
  const events = ["sendOffer", "sendAnswer", "sendIceCandidate", "sendVideoRequest", "sendMessage", "toggleVideo", "toggleAudio"];
  for (const event of events) {
    for (const payload of [undefined, null]) {
      await assert.doesNotReject(async () => handlers.get(event)(payload), `${event}(${payload})`);
    }
  }
});
