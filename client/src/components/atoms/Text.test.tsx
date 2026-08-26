import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Text from "./Text";

test("variant maps to a token color", () => {
  render(<Text variant="muted">m</Text>);
  expect(screen.getByText("m")).toHaveClass("text-text-muted");
});

test("as renders the requested element and className is appended", () => {
  render(<Text as="label" className="mb-2">L</Text>);
  const el = screen.getByText("L");
  expect(el.tagName).toBe("LABEL");
  expect(el).toHaveClass("mb-2");
});
