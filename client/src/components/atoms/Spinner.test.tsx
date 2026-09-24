import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Spinner from "./Spinner";

test("announces loading, with an optional label", () => {
  render(<Spinner label="Joining room…" />);
  expect(screen.getByRole("status")).toHaveTextContent("Joining room…");
  expect(screen.getByLabelText("Loading")).toBeInTheDocument();
});
