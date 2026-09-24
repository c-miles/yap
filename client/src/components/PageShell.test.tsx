import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PageShell from "./PageShell";

jest.mock("./WaveBackground/WaveBackground", () => () => <div data-testid="waves" />);
jest.mock("./Navbar", () => () => <nav />);
jest.mock("./Footer", () => () => <footer />);

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<PageShell />}>
          <Route path="*" element={<p>page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

test("every page sits on the waves inside a main landmark", () => {
  renderAt("/privacy");
  expect(screen.getByTestId("waves")).toBeInTheDocument();
  expect(screen.getByRole("main")).toHaveTextContent("page");
});

test("pages get the header and footer", () => {
  renderAt("/privacy");
  expect(screen.getByRole("navigation")).toBeInTheDocument();
  expect(screen.getByRole("contentinfo")).toBeInTheDocument();
});

test("the landing page skips the header but keeps the privacy and terms footer", () => {
  renderAt("/");
  expect(screen.queryByRole("navigation")).toBeNull();
  expect(screen.getByRole("contentinfo")).toBeInTheDocument();
});

test("chrome can be turned off for standalone screens", () => {
  render(
    <MemoryRouter initialEntries={["/room/x"]}>
      <PageShell chrome={false}>
        <p>joining</p>
      </PageShell>
    </MemoryRouter>
  );
  expect(screen.getByRole("main")).toHaveTextContent("joining");
  expect(screen.queryByRole("navigation")).toBeNull();
  expect(screen.queryByRole("contentinfo")).toBeNull();
});
