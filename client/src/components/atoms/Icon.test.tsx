import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Camera } from "lucide-react";
import Icon from "./Icon";

test("maps size tokens onto pixel dimensions", () => {
  const { container, rerender } = render(<Icon icon={Camera} size="sm" />);
  expect(container.querySelector("svg")).toHaveAttribute("width", "16");
  rerender(<Icon icon={Camera} size="xl" />);
  expect(container.querySelector("svg")).toHaveAttribute("width", "32");
  rerender(<Icon icon={Camera} size="2xl" />);
  expect(container.querySelector("svg")).toHaveAttribute("width", "48");
});

test("defaults to md (20)", () => {
  const { container } = render(<Icon icon={Camera} />);
  expect(container.querySelector("svg")).toHaveAttribute("width", "20");
});
