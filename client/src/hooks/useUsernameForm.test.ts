import React from "react";
import { act, renderHook } from "@testing-library/react";
import useUsernameForm from "./useUsernameForm";

const event = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;

test("saves the typed name and clears the field", async () => {
  const save = jest.fn().mockResolvedValue("");
  const { result } = renderHook(() => useUsernameForm(save));
  act(() => result.current.setUsername("ada"));
  await act(() => result.current.submit(event));
  expect(save).toHaveBeenCalledWith("ada");
  expect(result.current.username).toBe("");
  expect(result.current.error).toBe("");
});

test("keeps the name and shows why it was rejected", async () => {
  const save = jest.fn().mockResolvedValue("Username is already taken");
  const { result } = renderHook(() => useUsernameForm(save));
  act(() => result.current.setUsername("ada"));
  await act(() => result.current.submit(event));
  expect(result.current.error).toBe("Username is already taken");
  expect(result.current.username).toBe("ada");
});

test("is submitting only while the save runs", async () => {
  let finish: (error: string) => void = () => {};
  const save = jest.fn(() => new Promise<string>((resolve) => (finish = resolve)));
  const { result } = renderHook(() => useUsernameForm(save));
  act(() => {
    void result.current.submit(event);
  });
  expect(result.current.isSubmitting).toBe(true);
  await act(async () => finish(""));
  expect(result.current.isSubmitting).toBe(false);
});
