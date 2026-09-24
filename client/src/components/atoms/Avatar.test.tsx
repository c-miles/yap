import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Avatar from "./Avatar";

test("resets the fallback once a new src comes in", () => {
  const { rerender } = render(<Avatar src="http://x/broken.png" name="Ada" />);
  fireEvent.error(screen.getByAltText("Ada"));
  expect(screen.queryByAltText("Ada")).toBeNull();

  rerender(<Avatar src="http://x/good.png" name="Ada" />);
  expect(screen.getByAltText("Ada")).toBeInTheDocument();
});

test("renders the image when src is provided", () => {
  render(<Avatar src="http://x/a.png" name="Ada" />);
  const img = screen.getByAltText("Ada") as HTMLImageElement;
  expect(img.tagName).toBe("IMG");
  expect(img).toHaveClass("w-8", "h-8");
});

test("falls back to the User icon when there is no src", () => {
  render(<Avatar name="Ada" size="xl" />);
  expect(screen.queryByAltText("Ada")).toBeNull();
  expect(screen.getByRole("img", { name: "Ada" })).toHaveClass("w-32", "h-32");
});

test("falls back to the icon after the image errors", () => {
  render(<Avatar src="http://x/broken.png" name="Ada" />);
  fireEvent.error(screen.getByAltText("Ada"));
  expect(screen.queryByAltText("Ada")).toBeNull();
  expect(screen.getByRole("img", { name: "Ada" })).toBeInTheDocument();
});
