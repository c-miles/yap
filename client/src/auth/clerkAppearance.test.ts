import { clerkAppearance } from "./clerkAppearance";

test("has no var() refs, since clerk's own --accent would shadow ours", () => {
  expect(JSON.stringify(clerkAppearance)).not.toContain("var(");
});
