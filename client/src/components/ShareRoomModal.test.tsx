import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ShareRoomModal from "./ShareRoomModal";
import { copyToClipboard } from "../utils/copyToClipboard";

jest.mock("../utils/copyToClipboard");

const mockCopyToClipboard = copyToClipboard as jest.MockedFunction<typeof copyToClipboard>;

beforeEach(() => {
  mockCopyToClipboard.mockReset();
});

test("announces success when copying the room name works", async () => {
  mockCopyToClipboard.mockResolvedValue(true);
  render(<ShareRoomModal open onClose={jest.fn()} roomName="r" />);

  fireEvent.click(screen.getByRole("button", { name: /copy room name/i }));

  expect(await screen.findByText(/room name copied/i)).toBeInTheDocument();
});

test("shows a hint when copying the room name fails", async () => {
  mockCopyToClipboard.mockResolvedValue(false);
  render(<ShareRoomModal open onClose={jest.fn()} roomName="r" />);

  fireEvent.click(screen.getByRole("button", { name: /copy room name/i }));

  // Two elements say "Couldn't copy" (the visible hint and the aria-live announcement),
  // so match the visible hint's exact wording to keep the query unique.
  expect(await screen.findByText(/couldn't copy, press cmd\/ctrl\+c/i)).toBeInTheDocument();
});
