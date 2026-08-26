import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Badge from "./Badge";

test("default accent pill", () => {
  render(<Badge>3</Badge>);
  const el = screen.getByText("3");
  expect(el).toHaveClass("bg-accent", "text-accent-fg", "rounded-full", "text-xs");
});

test("danger variant and md size", () => {
  render(<Badge variant="danger" size="md">!</Badge>);
  const el = screen.getByText("!");
  expect(el).toHaveClass("bg-danger", "text-sm");
});
