import { authFetch } from "./authFetch";
import { setAuthTokenGetter } from "./authToken";

beforeEach(() => {
  (global as any).fetch = jest.fn(async () => ({ ok: true }));
});

afterEach(() => {
  setAuthTokenGetter(null);
});

test("attaches a bearer token when the getter provides one", async () => {
  setAuthTokenGetter(async () => "tok_123");
  await authFetch("/rooms/create", { method: "POST" });
  const [url, init] = (global as any).fetch.mock.calls[0];
  expect(url).toMatch(/\/rooms\/create$/);
  expect(init.method).toBe("POST");
  expect(init.headers.Authorization).toBe("Bearer tok_123");
});

test("sends without a header when no getter is registered", async () => {
  await authFetch("/rooms/create");
  const [, init] = (global as any).fetch.mock.calls[0];
  expect(init.headers.Authorization).toBeUndefined();
});

test("a throwing getter degrades to an unauthenticated request", async () => {
  setAuthTokenGetter(async () => {
    throw new Error("clerk hiccup");
  });
  await authFetch("/rooms/create");
  const [, init] = (global as any).fetch.mock.calls[0];
  expect(init.headers.Authorization).toBeUndefined();
});
