import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import WaitingForOthers from "./WaitingForOthers";

test("shows the waiting CTA and copies the invite", async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  render(<WaitingForOthers roomName="r" />);
  expect(screen.getByText(/waiting for others/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /copy invite/i }));
  expect(writeText).toHaveBeenCalledWith("http://localhost/room/r");
  await waitFor(() => expect(screen.getByText(/copied/i)).toBeInTheDocument());
});
