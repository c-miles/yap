import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CallHeader from "./CallHeader";

test("shows room name and pluralized participant count", () => {
  render(<CallHeader roomName="brave-blue-tiger" participantCount={3} roomId="brave-blue-tiger" visible />);
  expect(screen.getByText("brave-blue-tiger")).toBeInTheDocument();
  expect(screen.getByText(/3 people/)).toBeInTheDocument();
});

test("singular participant reads 'person'", () => {
  render(<CallHeader participantCount={1} roomId="r" visible />);
  expect(screen.getByText(/1 person/)).toBeInTheDocument();
});

test("copy invite writes the room URL and flips to Copied", async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  render(<CallHeader roomName="r" participantCount={2} roomId="r" visible />);

  fireEvent.click(screen.getByRole("button", { name: /copy invite/i }));
  expect(writeText).toHaveBeenCalledWith("http://localhost/room/r");
  await waitFor(() => expect(screen.getByText(/copied/i)).toBeInTheDocument());
});
