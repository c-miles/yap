import test from "node:test";
import assert from "node:assert/strict";
import { createSocketAuth } from "../sockets/socketAuth.js";

function fakeSocket(token) {
  return { handshake: { auth: token === undefined ? {} : { token } }, data: {} };
}

test("rejects a connection with no token", async () => {
  const middleware = createSocketAuth({ secretKey: "sk", verify: async () => ({ sub: "user_1" }) });
  const socket = fakeSocket(undefined);
  let error = null;
  await middleware(socket, (err) => { error = err; });
  assert.ok(error instanceof Error);
  assert.equal(error.message, "unauthorized");
});

test("rejects a connection whose token fails verification", async () => {
  const middleware = createSocketAuth({
    secretKey: "sk",
    verify: async () => { throw new Error("bad token"); },
  });
  const socket = fakeSocket("expired.jwt");
  let error = null;
  await middleware(socket, (err) => { error = err; });
  assert.ok(error instanceof Error);
  assert.equal(socket.data.userId, undefined);
});

test("stamps the user id from the token's sub and passes", async () => {
  const seen = {};
  const middleware = createSocketAuth({
    secretKey: "sk",
    authorizedParties: ["http://localhost:3000"],
    verify: async (token, options) => {
      seen.token = token;
      seen.options = options;
      return { sub: "user_42" };
    },
  });
  const socket = fakeSocket("good.jwt");
  let error = "unset";
  await middleware(socket, (err) => { error = err; });
  assert.equal(error, undefined);
  assert.equal(socket.data.userId, "user_42");
  assert.equal(seen.token, "good.jwt");
  assert.equal(seen.options.secretKey, "sk");
  assert.deepEqual(seen.options.authorizedParties, ["http://localhost:3000"]);
});
