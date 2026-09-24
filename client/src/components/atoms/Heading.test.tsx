import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Heading from "./Heading";

test("level drives the tag and size", () => {
  render(<Heading level={1}>hi</Heading>);
  expect(screen.getByRole("heading", { level: 1 })).toHaveClass("text-3xl");
});

test("defaults to a level 2 section heading", () => {
  render(<Heading>hi</Heading>);
  expect(screen.getByRole("heading", { level: 2 })).toHaveClass("text-xl");
});
