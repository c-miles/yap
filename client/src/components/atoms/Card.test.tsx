import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Card from "./Card";

test("renders children inside a token-styled surface", () => {
  render(<Card>hello</Card>);
  const el = screen.getByText("hello");
  expect(el).toHaveClass("bg-surface", "border", "border-border", "rounded-lg", "p-6");
});

test("padding prop swaps the padding scale and className is appended", () => {
  render(<Card padding="lg" className="max-w-md">x</Card>);
  const el = screen.getByText("x");
  expect(el).toHaveClass("p-8", "max-w-md");
  expect(el).not.toHaveClass("p-6");
});
