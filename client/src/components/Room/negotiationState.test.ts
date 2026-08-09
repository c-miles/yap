import { isPolite, shouldIgnoreOffer } from "./negotiationState";

describe("isPolite", () => {
  test("exactly one side of any pair is polite", () => {
    expect(isPolite("aaa", "bbb")).toBe(true);
    expect(isPolite("bbb", "aaa")).toBe(false);
  });

  test("is deterministic and asymmetric for many pairs", () => {
    const ids = ["k3j2", "a1b2", "zz99", "m0m0"];
    for (const a of ids) {
      for (const b of ids) {
        if (a === b) continue;
        expect(isPolite(a, b)).toBe(!isPolite(b, a));
      }
    }
  });
});

describe("shouldIgnoreOffer", () => {
  test("nobody ignores an offer arriving in stable state with no offer in flight", () => {
    expect(shouldIgnoreOffer(true, false, "stable", false)).toBe(false);
    expect(shouldIgnoreOffer(false, false, "stable", false)).toBe(false);
  });

  test("impolite peer ignores an offer that collides with its own outgoing offer", () => {
    expect(shouldIgnoreOffer(false, true, "stable", false)).toBe(true);
    expect(shouldIgnoreOffer(false, false, "have-local-offer", false)).toBe(true);
  });

  test("polite peer never ignores — it rolls back instead", () => {
    expect(shouldIgnoreOffer(true, true, "stable", false)).toBe(false);
    expect(shouldIgnoreOffer(true, false, "have-local-offer", false)).toBe(false);
  });

  test("an offer arriving while a remote ANSWER is being applied is not a collision", () => {
    expect(shouldIgnoreOffer(false, false, "have-local-offer", true)).toBe(false);
  });
});
