import { getIceServers, resetIceServerCache, STUN_FALLBACK } from "./iceServers";

const mockFetch = (impl: () => Promise<any>) => {
  (global as any).fetch = jest.fn(impl);
};

beforeEach(() => {
  resetIceServerCache();
});

test("returns servers from the endpoint and caches them", async () => {
  const servers = [{ urls: "turn:relay.example.com:443", username: "u", credential: "c" }];
  mockFetch(async () => ({ ok: true, json: async () => ({ iceServers: servers }) }));

  expect(await getIceServers()).toEqual(servers);
  expect(await getIceServers()).toEqual(servers);
  expect((global as any).fetch).toHaveBeenCalledTimes(1);
});

test("falls back to STUN when the endpoint fails", async () => {
  mockFetch(async () => ({ ok: false, status: 500 }));
  expect(await getIceServers()).toEqual(STUN_FALLBACK);
});

test("falls back to STUN when fetch throws", async () => {
  mockFetch(async () => {
    throw new Error("network down");
  });
  expect(await getIceServers()).toEqual(STUN_FALLBACK);
});

test("concurrent calls share one in-flight fetch", async () => {
  const servers = [{ urls: "turn:relay.example.com:443", username: "u", credential: "c" }];
  let resolveFetch: (value: any) => void;
  const deferred = new Promise(resolve => {
    resolveFetch = resolve;
  });
  mockFetch(() => deferred.then(() => ({ ok: true, json: async () => ({ iceServers: servers }) })));

  const first = getIceServers();
  const second = getIceServers();
  resolveFetch!(undefined);

  expect(await first).toEqual(servers);
  expect(await second).toEqual(servers);
  expect((global as any).fetch).toHaveBeenCalledTimes(1);
});
