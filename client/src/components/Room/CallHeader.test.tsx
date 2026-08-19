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
