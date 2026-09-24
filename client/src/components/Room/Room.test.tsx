import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Room from "./Room";

jest.mock("@clerk/react", () => ({}));
jest.mock("../WaveBackground/WaveBackground", () => () => null);

const socket = { on: jest.fn(), off: jest.fn(), emit: jest.fn() };

const renderRoom = (overrides: Partial<React.ComponentProps<typeof Room>> = {}) =>
  render(
    <Room
      audioEnabled
      localStream={null}
      localUserId="user_1"
      localUsername="ada"
      localVideoEnabled
      localVideoRef={React.createRef()}
      participants={new Map()}
      setVideoPermissionError={jest.fn()}
      videoPermissionError={null}
      roomId="brave-blue-fox"
      roomError={null}
      isConnecting={false}
      toggleAudio={jest.fn()}
      toggleVideo={jest.fn()}
      onLeaveRoom={jest.fn()}
      onDashboard={jest.fn()}
      socket={socket}
      {...overrides}
    />,
    { wrapper: MemoryRouter }
  );

test("a room error explains itself and leads back to the lounge", () => {
  const onDashboard = jest.fn();
  renderRoom({ roomError: "You joined this room from another tab or device.", onDashboard });
  expect(screen.getByRole("heading", { level: 1, name: "Unable to join room" })).toBeInTheDocument();
  expect(screen.getByText("You joined this room from another tab or device.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Back to lounge" }));
  expect(onDashboard).toHaveBeenCalled();
});

test("connecting shows a spinner that says what it's doing", () => {
  renderRoom({ isConnecting: true });
  expect(screen.getByRole("status")).toHaveTextContent(/connecting/i);
});
