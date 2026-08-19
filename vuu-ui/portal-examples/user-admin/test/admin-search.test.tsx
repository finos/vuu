import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { AdminSearch } from "../src/components/AdminSearch";

it("commits search on Enter, never on typing, blur or clearing", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const onSearch = vi.fn();
  try {
    await act(async () =>
      root.render(
        <AdminSearch label="Search identities" onSearch={onSearch} />,
      ),
    );
    const input = container.querySelector("input");
    if (!input) throw new Error("Search input not rendered");
    await act(async () => {
      input.value = " alice ";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    });
    expect(onSearch).not.toHaveBeenCalled();
    await act(async () =>
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      ),
    );
    expect(onSearch).toHaveBeenLastCalledWith("alice");
    await act(async () => {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    });
    expect(onSearch).toHaveBeenCalledTimes(1);
    await act(async () =>
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      ),
    );
    expect(onSearch).toHaveBeenLastCalledWith("");
  } finally {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
