import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Card from "./Card";

test("renders children on a glass panel and appends className", () => {
  render(<Card className="max-w-md">hello</Card>);
  const el = screen.getByText("hello");
  expect(el).toHaveClass("glass-panel", "rounded-xl", "p-8", "max-w-md");
});
