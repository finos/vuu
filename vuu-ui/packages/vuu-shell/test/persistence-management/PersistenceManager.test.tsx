import React from "react";
import "@finos/vuu-layout/test/global-mocks";
import { renderHook } from "@testing-library/react-hooks";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { LayoutJSON, isLayoutJSON, resolveJSONPath } from "@finos/vuu-layout";

import { useNotifications } from "@finos/vuu-popups";

import {
  LayoutManagementProvider,
  LayoutMetadata,
  useLayoutManager,
} from "../../src";

import {
  LocalPersistenceManager,
  PersistenceManager,
} from "../../src/persistence-management";

const defaultLayout = vi.hoisted(() => ({
  type: "Stack",
  title: "test-layout",
}));

const newLayout: LayoutJSON = {
  type: "Stack",
  props: {
    title: "test-layout-edited",
  },
};

const metadata: LayoutMetadata = {
  name: "test-name",
  group: "test-group",
  screenshot: "test-screenshot",
  user: "test-user",
  created: "test-date",
  id: "test-id",
};

const initialApplicationJSON = vi.hoisted(() => ({
  layout: defaultLayout,
}));

vi.stubEnv("LOCAL", "true");

vi.mock(
  "../../src/persistence-management/LocalPersistenceManager",
  async () => {
    const MockPersistenceManager = vi.fn();
    MockPersistenceManager.prototype.loadMetadata = vi.fn();
    MockPersistenceManager.prototype.loadApplicationJSON = vi.fn();
    MockPersistenceManager.prototype.saveApplicationJSON = vi.fn();
    MockPersistenceManager.prototype.createLayout = vi.fn();
    MockPersistenceManager.prototype.updateLayout = vi.fn();
    MockPersistenceManager.prototype.deleteLayout = vi.fn();
    MockPersistenceManager.prototype.loadLayout = vi.fn();

    return { LocalPersistenceManager: MockPersistenceManager };
  }
);

vi.mock("../../src/persistence-management/defaultApplicationJson", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/persistence-management/defaultApplicationJson")
  >("../../src/persistence-management/defaultApplicationJson");
  return {
    ...actual,
    loadingApplicationJson: initialApplicationJSON,
  };
});

vi.mock("@finos/vuu-popups", async () => {
  const actual = await vi.importActual<typeof import("@finos/vuu-popups")>(
    "@finos/vuu-popups"
  );
  const mockNotify = vi.fn();
  return {
    ...actual,
    useNotifications: vi.fn(() => mockNotify),
  };
});

vi.mock("@finos/vuu-layout", async () => {
  const actual = await vi.importActual<typeof import("@finos/vuu-layout")>(
    "@finos/vuu-layout"
  );
  return {
    ...actual,
    isLayoutJSON: vi.fn(),
    resolveJSONPath: vi.fn(),
  };
});

const wrapper = ({ children }) => (
  <LayoutManagementProvider>{children}</LayoutManagementProvider>
);

describe("LayoutManagementProvider", () => {
  let persistence: PersistenceManager;

  beforeEach(() => {
    persistence = new LocalPersistenceManager();
    vi.mocked(persistence.loadMetadata).mockResolvedValueOnce([]);
    vi.mocked(persistence.loadApplicationJSON).mockResolvedValueOnce(
      initialApplicationJSON
    );
    vi.spyOn(global.console, "error");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls loadMetadata and loadApplicationJSON on mount", () => {
    const { result } = renderHook(() => useLayoutManager(), { wrapper });

    expect(persistence.loadMetadata).toHaveBeenCalled();
    expect(persistence.loadApplicationJSON).toHaveBeenCalled();
    expect(result.current.applicationJson).toBe(initialApplicationJSON);
  });

  describe("saveApplicationLayout", () => {
    it("calls saveApplicationJSON when layout is valid", () => {
      const { result } = renderHook(useLayoutManager, { wrapper });

      vi.mocked(persistence.saveApplicationJSON).mockResolvedValueOnce();
      vi.mocked(isLayoutJSON).mockReturnValue(true);

      result.current.saveApplicationLayout(newLayout);

      expect(persistence.saveApplicationJSON).toHaveBeenCalledWith({
        ...initialApplicationJSON,
        layout: newLayout,
      });
    });

    it("doesn't call saveApplicationJSON and logs error when layout is not valid ", () => {
      const { result } = renderHook(() => useLayoutManager(), { wrapper });

      vi.mocked(persistence.saveApplicationJSON).mockResolvedValueOnce();
      vi.mocked(isLayoutJSON).mockReturnValue(false);

      result.current.saveApplicationLayout(newLayout);

      expect(persistence.saveApplicationJSON).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        "Tried to save invalid application layout",
        newLayout
      );
    });
  });

  describe("saveLayout", () => {
    it("calls createLayout when layout is valid and path is resolved", () => {
      const { result } = renderHook(() => useLayoutManager(), { wrapper });

      vi.mocked(persistence.createLayout).mockResolvedValueOnce(metadata);
      vi.mocked(isLayoutJSON).mockReturnValue(true);
      vi.mocked(resolveJSONPath).mockReturnValue(newLayout);

      result.current.saveLayout(metadata);

      expect(persistence.createLayout).toHaveBeenCalledWith(
        metadata,
        newLayout
      );
    });

    it("doesn't call createLayout, triggers error notification and logs error when layout path can't be resolved ", () => {
      const { result } = renderHook(() => useLayoutManager(), { wrapper });
      const notify = useNotifications();

      vi.mocked(persistence.createLayout).mockResolvedValueOnce(metadata);
      vi.mocked(resolveJSONPath).mockReturnValue(undefined);
      vi.mocked(isLayoutJSON).mockReturnValue(true);

      result.current.saveLayout(metadata);

      expect(persistence.createLayout).not.toHaveBeenCalled();
      expect(notify).toHaveBeenCalledWith({
        body: "Cannot save invalid layout",
        header: "Failed to Save Layout",
        type: "error",
      });
      expect(console.error).toHaveBeenCalledWith(
        "Tried to save invalid layout",
        undefined
      );
    });

    it("doesn't call createLayout, triggers error notification and logs error when layout is not valid", () => {
      const { result } = renderHook(() => useLayoutManager(), { wrapper });
      const notify = useNotifications();

      vi.mocked(persistence.createLayout).mockResolvedValueOnce(metadata);
      vi.mocked(isLayoutJSON).mockReturnValue(false);
      vi.mocked(resolveJSONPath).mockReturnValue(defaultLayout);

      result.current.saveLayout(metadata);

      expect(persistence.createLayout).not.toHaveBeenCalled();
      expect(notify).toHaveBeenCalledWith({
        body: "Cannot save invalid layout",
        header: "Failed to Save Layout",
        type: "error",
      });
      expect(console.error).toHaveBeenCalledWith(
        "Tried to save invalid layout",
        defaultLayout
      );
    });
  });
});
