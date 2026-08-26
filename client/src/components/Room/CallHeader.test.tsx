import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CallHeader from "./CallHeader";

test("shows room name and pluralized participant count", () => {
  render(<CallHeader roomName="brave-blue-tiger" participantCount={3} visible />);
  expect(screen.getByText("brave-blue-tiger")).toBeInTheDocument();
  expect(screen.getByText(/3 people/)).toBeInTheDocument();
});

test("singular participant reads 'person'", () => {
  render(<CallHeader participantCount={1} visible />);
  expect(screen.getByText(/1 person/)).toBeInTheDocument();
});

test("insets to the video column when chat is open", () => {
  const { container } = render(<CallHeader participantCount={2} visible chatOpen />);
  expect(container.querySelector("header")).toHaveClass("md:right-80");
});

test("spans full width when chat is closed", () => {
  const { container } = render(<CallHeader participantCount={2} visible />);
  expect(container.querySelector("header")).not.toHaveClass("md:right-80");
});
