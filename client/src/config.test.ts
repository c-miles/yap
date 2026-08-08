import { resolveApiBaseUrl } from "./config";

test("explicit env var wins in any mode", () => {
  expect(
    resolveApiBaseUrl({ REACT_APP_API_BASE_URL: "https://api.example.com", NODE_ENV: "production" })
  ).toBe("https://api.example.com");
});

test("production defaults to same-origin (empty string)", () => {
  expect(resolveApiBaseUrl({ NODE_ENV: "production" })).toBe("");
});

test("development defaults to the backend port, not the CRA port", () => {
  expect(resolveApiBaseUrl({ NODE_ENV: "development" })).toBe("http://localhost:3001");
});
