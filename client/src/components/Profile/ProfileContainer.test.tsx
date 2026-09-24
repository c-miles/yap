import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProfileContainer from "./index";

let mockAuth: { userInfo: any; userExists: boolean | null; handleUsernameSubmit: () => Promise<string> };
jest.mock("../../hooks/useAuthUser", () => () => mockAuth);

test("shows a loader instead of an empty profile while it loads", () => {
  mockAuth = { userInfo: null, userExists: null, handleUsernameSubmit: async () => "" };
  render(<ProfileContainer />);
  expect(screen.queryByText(/joined yap/i)).toBeNull();
  expect(screen.getByLabelText("Loading")).toBeInTheDocument();
});

test("shows the profile once it has loaded", () => {
  mockAuth = { userInfo: { username: "ada", picture: "", createdAt: new Date("2026-01-02") }, userExists: true, handleUsernameSubmit: async () => "" };
  render(<ProfileContainer />);
  expect(screen.getByRole("heading", { name: "ada" })).toBeInTheDocument();
});
