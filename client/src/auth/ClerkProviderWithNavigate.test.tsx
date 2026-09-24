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

const renderProvider = () => {
  process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = "pk_test_x";
  const ClerkProviderWithNavigate = require("./ClerkProviderWithNavigate").default;
  render(<MemoryRouter><ClerkProviderWithNavigate>hi</ClerkProviderWithNavigate></MemoryRouter>);
};

test("sign-ins land in the lounge, not back on the landing page", () => {
  renderProvider();
  expect(mockProviderProps).toHaveBeenCalledWith(
    expect.objectContaining({ signInFallbackRedirectUrl: "/dashboard", signUpFallbackRedirectUrl: "/dashboard" })
  );
});

test("the first sign-in step has no title, since the wordmark sits right above it", () => {
  renderProvider();
  expect(mockProviderProps).toHaveBeenCalledWith(
    expect.objectContaining({ localization: { signIn: { start: { titleCombined: "" } } } })
  );
});
