import { existsSync } from "fs";
import path from "path";
import { clerkAppearance } from "./clerkAppearance";

test("has no var() refs, since clerk's own --accent would shadow ours", () => {
  expect(JSON.stringify(clerkAppearance)).not.toContain("var(");
});

test("the sign-in modal shows the wide wordmark from a file we ship", () => {
  const logo = clerkAppearance.options?.logoImageUrl;
  expect(logo).toBe("/wordmark.png");
  expect(existsSync(path.join(__dirname, "../../public", logo!))).toBe(true);
});
