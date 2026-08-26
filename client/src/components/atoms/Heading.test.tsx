import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Heading from "./Heading";

test("level drives the tag and default size", () => {
  render(<Heading level={1}>hi</Heading>);
  const h = screen.getByRole("heading", { level: 1 });
  expect(h).toHaveClass("font-display", "text-4xl");
});

test("size overrides the level default", () => {
  render(<Heading level={3} size="2xl">hi</Heading>);
  const h = screen.getByRole("heading", { level: 3 });
  expect(h).toHaveClass("text-6xl");
  expect(h).not.toHaveClass("text-xl");
});
