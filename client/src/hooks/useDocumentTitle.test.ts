import { renderHook } from "@testing-library/react";
import useDocumentTitle from "./useDocumentTitle";

test("names the page, then the app", () => {
  renderHook(() => useDocumentTitle("Lounge"));
  expect(document.title).toBe("Lounge · yap");
});

test("falls back to the site title", () => {
  const { rerender } = renderHook(({ title }: { title?: string }) => useDocumentTitle(title), {
    initialProps: { title: "Lounge" as string | undefined },
  });
  rerender({ title: undefined });
  expect(document.title).toBe("yap · Drop-in video rooms for your group");
});
