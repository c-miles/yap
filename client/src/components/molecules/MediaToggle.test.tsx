import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import MediaToggle from "./MediaToggle";

test("reports its off state and toggles on click", () => {
  const onClick = jest.fn();
  render(<MediaToggle label="Mic" off onClick={onClick} onIcon={<i>on</i>} offIcon={<i>off</i>} layout="inline" />);
  const button = screen.getByRole("button", { name: /mic/i });
  expect(button).toHaveAttribute("aria-pressed", "true");
  expect(button).toHaveTextContent("off");
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalled();
});
