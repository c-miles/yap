import { existsSync, readFileSync } from "fs";
import path from "path";

const client = path.join(__dirname, "..");
const read = (file: string) => readFileSync(path.join(client, file), "utf8");
const urls = (text: string, pattern: RegExp) => Array.from(text.matchAll(pattern), (match) => match[1]);

const html = read("public/index.html");
const preloaded = urls(html, /rel="preload" href="%PUBLIC_URL%(\/fonts\/[^"]+)"/g);
const fontFaces = urls(html, /url\("%PUBLIC_URL%(\/fonts\/[^"]+)"\)/g);

test("preloads the latin fonts so the first paint is already in our fonts", () => {
  expect(preloaded).toEqual(expect.arrayContaining(["/fonts/inter-latin.woff2", "/fonts/bricolage-grotesque-latin.woff2"]));
});

test("every preloaded font is one an @font-face actually uses", () => {
  preloaded.forEach((url) => expect(fontFaces).toContain(url));
});

test("every @font-face points at a file we ship", () => {
  expect(fontFaces.length).toBeGreaterThan(0);
  fontFaces.forEach((url) => expect(existsSync(path.join(client, "public", url))).toBe(true));
});
