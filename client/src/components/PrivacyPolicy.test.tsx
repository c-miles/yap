import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PrivacyPolicy from "./PrivacyPolicy";

test("privacy requests go to the company inbox", () => {
  render(<PrivacyPolicy />);
  const links = screen.getAllByRole("link", { name: "contact@anomaly-labs.com" });
  expect(links.length).toBeGreaterThan(0);
  links.forEach((link) => expect(link).toHaveAttribute("href", "mailto:contact@anomaly-labs.com"));
});

test("names every sign-in provider it can get your details from", () => {
  render(<PrivacyPolicy />);
  expect(screen.getAllByText(/Google, Microsoft, or GitHub/)).toHaveLength(2);
});
