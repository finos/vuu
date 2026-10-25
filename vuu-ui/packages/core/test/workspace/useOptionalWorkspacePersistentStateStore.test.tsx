import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  useOptionalWorkspacePersistentStateStore,
  WorkspacePersistentStateProvider,
  WorkspacePersistentStateStore,
} from "../../src";

describe("useOptionalWorkspacePersistentStateStore", () => {
  let container: HTMLDivElement;
  let root: Root;
  let result: WorkspacePersistentStateStore | undefined | null;

  const Probe = () => {
    result = useOptionalWorkspacePersistentStateStore();
    return null;
  };

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    result = null;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("returns undefined outside a WorkspacePersistentStateProvider", () => {
    act(() => root.render(<Probe />));
    expect(result).toBeUndefined();
  });

  it("returns the store inside a WorkspacePersistentStateProvider", () => {
    const store = new WorkspacePersistentStateStore();
    act(() =>
      root.render(
        <WorkspacePersistentStateProvider store={store}>
          <Probe />
        </WorkspacePersistentStateProvider>,
      ),
    );
    expect(result).toBe(store);
  });
});
