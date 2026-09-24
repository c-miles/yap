import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import StatePanel from "./StatePanel";

test("shows a titled panel with its description and actions", () => {
  render(
    <StatePanel title="Nothing here" description="Check the link.">
      <button>Go home</button>
    </StatePanel>
  );
  expect(screen.getByRole("heading", { level: 1, name: "Nothing here" })).toBeInTheDocument();
  expect(screen.getByText("Check the link.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Go home" })).toBeInTheDocument();
});

test("can sit under a page's own heading", () => {
  render(<StatePanel title="Couldn't load your profile" headingLevel={2} />);
  expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
});
