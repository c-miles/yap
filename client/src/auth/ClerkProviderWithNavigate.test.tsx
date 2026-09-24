import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockProviderProps = jest.fn();
jest.mock("@clerk/react", () => ({
  ClerkProvider: (props: { children: React.ReactNode }) => {
    mockProviderProps(props);
    return <>{props.children}</>;
  },
  useAuth: () => ({ getToken: jest.fn() }),
}));

test("sign-ins land in the lounge, not back on the landing page", () => {
  process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = "pk_test_x";
  const ClerkProviderWithNavigate = require("./ClerkProviderWithNavigate").default;
  render(<MemoryRouter><ClerkProviderWithNavigate>hi</ClerkProviderWithNavigate></MemoryRouter>);
  expect(mockProviderProps).toHaveBeenCalledWith(
    expect.objectContaining({ signInFallbackRedirectUrl: "/dashboard", signUpFallbackRedirectUrl: "/dashboard" })
  );
});
