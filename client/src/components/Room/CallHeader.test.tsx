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
  render(<CallHeader participantCount={2} visible chatOpen />);
  expect(screen.getByRole("banner")).toHaveClass("md:right-80");
});

test("spans full width when chat is closed", () => {
  render(<CallHeader participantCount={2} visible />);
  expect(screen.getByRole("banner")).not.toHaveClass("md:right-80");
});

test("the room name is the call's page heading", () => {
  render(<CallHeader roomName="brave-blue-tiger" participantCount={2} visible />);
  expect(screen.getByRole("heading", { level: 1, name: "brave-blue-tiger" })).toBeInTheDocument();
});
