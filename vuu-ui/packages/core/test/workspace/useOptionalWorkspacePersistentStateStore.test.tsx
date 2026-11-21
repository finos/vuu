import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  useOptionalWorkspacePersistentStateStore,
  WorkspacePersistentStateProvider,
  WorkspacePersistentStateStore,
} from "../../src";

const Probe = ({
  onResult,
}: {
  onResult: (store: WorkspacePersistentStateStore | undefined) => void;
}) => {
  onResult(useOptionalWorkspacePersistentStateStore());
  return null;
};

describe("useOptionalWorkspacePersistentStateStore", () => {
  let container: HTMLDivElement;
  let root: Root;
  let result: WorkspacePersistentStateStore | undefined | null;

  const captureResult = (value: WorkspacePersistentStateStore | undefined) => {
    result = value;
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
    act(() => root.render(<Probe onResult={captureResult} />));
    expect(result).toBeUndefined();
  });

  it("returns the store inside a WorkspacePersistentStateProvider", () => {
    const store = new WorkspacePersistentStateStore();
    act(() =>
      root.render(
        <WorkspacePersistentStateProvider store={store}>
          <Probe onResult={captureResult} />
        </WorkspacePersistentStateProvider>,
      ),
    );
    expect(result).toBe(store);
  });
});
