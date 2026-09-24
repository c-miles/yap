import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Text from "./Text";

test("variant maps to a token color", () => {
  render(<Text variant="muted">m</Text>);
  expect(screen.getByText("m")).toHaveClass("text-text-muted");
});

test("className is appended", () => {
  render(<Text className="mb-2">L</Text>);
  expect(screen.getByText("L")).toHaveClass("mb-2");
});
