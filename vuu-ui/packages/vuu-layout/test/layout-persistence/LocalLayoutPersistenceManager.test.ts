import "../global-mocks";
import { Layout, LayoutMetadata } from "@finos/vuu-shell";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalLayoutPersistenceManager } from "../../src/layout-persistence";
import { LayoutJSON } from "../../src/layout-reducer";
import {
  getLocalEntity,
  saveLocalEntity,
} from "../../../vuu-filters/src/local-config";

vi.mock("@finos/vuu-filters", async () => {
  return {
    getLocalEntity: <T>(url: string): T | undefined => {
      const data = localStorage.getItem(url);
      return data ? JSON.parse(data) : undefined;
    },
    saveLocalEntity: <T>(url: string, data: T): T | undefined => {
      try {
        localStorage.setItem(url, JSON.stringify(data));
        return data;
      } catch {
        return undefined;
      }
    },
  };
});

const persistenceManager = new LocalLayoutPersistenceManager();

const existingId = "existing_id";

const existingMetadata: LayoutMetadata = {
  id: existingId,
  name: "Existing Layout",
  group: "Group 1",
  screenshot: "screenshot",
  user: "vuu user",
  date: "01/01/2023",
};

const existingLayout: Layout = {
  id: existingId,
  json: { type: "t0" },
};

const metadataToAdd: Omit<LayoutMetadata, "id"> = {
  name: "New Layout",
  group: "Group 1",
  screenshot: "screenshot",
  user: "vuu user",
  date: "26/09/2023",
};

const layoutToAdd: LayoutJSON = {
  type: "t",
};

const metadataSaveLocation = "layouts/metadata";
const layoutsSaveLocation = "layouts/layouts";

afterEach(() => {
  localStorage.clear();
});

describe("createLayout", () => {
  it("persists to local storage with a unique ID", async () => {
    const returnedId = await persistenceManager.createLayout(
      metadataToAdd,
      layoutToAdd
    );

    const persistedMetadata =
      getLocalEntity<LayoutMetadata[]>(metadataSaveLocation);
    const persistedLayout = getLocalEntity<Layout[]>(layoutsSaveLocation);

    const expectedMetadata: LayoutMetadata = {
      ...metadataToAdd,
      id: returnedId,
    };

    const expectedLayout: Layout = {
      json: layoutToAdd,
      id: returnedId,
    };

    expect(persistedMetadata).toEqual([expectedMetadata]);
    expect(persistedLayout).toEqual([expectedLayout]);
  });

  it("adds to existing storage", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout]);

    const returnedId = await persistenceManager.createLayout(
      metadataToAdd,
      layoutToAdd
    );
    expect(returnedId).not.toEqual(existingId);

    const persistedMetadata =
      getLocalEntity<LayoutMetadata[]>(metadataSaveLocation);
    const persistedLayout = getLocalEntity<Layout[]>(layoutsSaveLocation);

    const expectedMetadata: LayoutMetadata = {
      ...metadataToAdd,
      id: returnedId,
    };

    const expectedLayout: Layout = {
      json: layoutToAdd,
      id: returnedId,
    };

    expect(persistedMetadata).toEqual([existingMetadata, expectedMetadata]);
    expect(persistedLayout).toEqual([existingLayout, expectedLayout]);
  });
});

describe("updateLayout", () => {
  it("updates an existing layout", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout]);

    await persistenceManager.updateLayout(
      existingId,
      metadataToAdd,
      layoutToAdd
    );

    const persistedMetadata =
      getLocalEntity<LayoutMetadata[]>(metadataSaveLocation);
    const persistedLayout = getLocalEntity<Layout[]>(layoutsSaveLocation);

    const expectedMetadata: LayoutMetadata = {
      ...metadataToAdd,
      id: existingId,
    };

    const expectedLayout: Layout = {
      json: layoutToAdd,
      id: existingId,
    };

    expect(persistedMetadata).toEqual([expectedMetadata]);
    expect(persistedLayout).toEqual([expectedLayout]);
  });

  it("errors if there is no metadata in local storage with requested ID ", async () => {
    saveLocalEntity(layoutsSaveLocation, [existingLayout]);

    expectError(
      () =>
        persistenceManager.updateLayout(existingId, metadataToAdd, layoutToAdd),
      `No metadata with ID ${existingId}`
    );
  });

  it("errors if there is no layout in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);

    expectError(
      () =>
        persistenceManager.updateLayout(existingId, metadataToAdd, layoutToAdd),
      `No layout with ID ${existingId}`
    );
  });

  it("errors if there is no metadata or layout in local storage with requested ID ", async () => {
    const requestedId = "non_existent_id";

    expectError(
      () =>
        persistenceManager.updateLayout(
          requestedId,
          metadataToAdd,
          layoutToAdd
        ),
      `No metadata with ID ${requestedId}; No layout with ID ${requestedId}`
    );
  });

  it("errors if there are multiple metadata entries in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout]);

    expectError(
      () =>
        persistenceManager.updateLayout(existingId, metadataToAdd, layoutToAdd),
      `Non-unique metadata with ID ${existingId}`
    );
  });

  it("errors if there are multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectError(
      () =>
        persistenceManager.updateLayout(existingId, metadataToAdd, layoutToAdd),
      `Non-unique layout with ID ${existingId}`
    );
  });

  it("errors if there are multiple metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectError(
      () =>
        persistenceManager.updateLayout(existingId, metadataToAdd, layoutToAdd),
      `Non-unique metadata with ID ${existingId}; Non-unique layout with ID ${existingId}`
    );
  });

  it("errors if there are multiple metadata entries and no layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);

    expectError(
      () =>
        persistenceManager.updateLayout(existingId, metadataToAdd, layoutToAdd),
      `Non-unique metadata with ID ${existingId}; No layout with ID ${existingId}`
    );
  });

  it("errors if there are no metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectError(
      () =>
        persistenceManager.updateLayout(existingId, metadataToAdd, layoutToAdd),
      `No metadata with ID ${existingId}; Non-unique layout with ID ${existingId}`
    );
  });
});

describe("deleteLayout", () => {
  it("removes items from storage", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout]);

    await persistenceManager.deleteLayout(existingId);

    const persistedMetadata =
      getLocalEntity<LayoutMetadata[]>(metadataSaveLocation);
    const persistedLayouts = getLocalEntity<Layout[]>(layoutsSaveLocation);

    expect(persistedMetadata).toEqual([]);
    expect(persistedLayouts).toEqual([]);
  });

  it("errors if there is no metadata in local storage with requested ID ", async () => {
    saveLocalEntity(layoutsSaveLocation, [existingLayout]);

    expectError(
      () => persistenceManager.deleteLayout(existingId),
      `No metadata with ID ${existingId}`
    );
  });

  it("errors if there is no layout in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);

    expectError(
      () => persistenceManager.deleteLayout(existingId),
      `No layout with ID ${existingId}`
    );
  });

  it("errors if there is no metadata or layout in local storage with requested ID ", async () => {
    const requestedId = "non_existent_id";

    expectError(
      () => persistenceManager.deleteLayout(requestedId),
      `No metadata with ID ${requestedId}; No layout with ID ${requestedId}`
    );
  });

  it("errors if there are multiple metadata entries in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout]);

    expectError(
      () => persistenceManager.deleteLayout(existingId),
      `Non-unique metadata with ID ${existingId}`
    );
  });

  it("errors if there are multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectError(
      () => persistenceManager.deleteLayout(existingId),
      `Non-unique layout with ID ${existingId}`
    );
  });

  it("errors if there are multiple metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectError(
      () => persistenceManager.deleteLayout(existingId),
      `Non-unique metadata with ID ${existingId}; Non-unique layout with ID ${existingId}`
    );
  });

  it("errors if there are multiple metadata entries and no layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);

    expectError(
      () => persistenceManager.deleteLayout(existingId),
      `Non-unique metadata with ID ${existingId}; No layout with ID ${existingId}`
    );
  });

  it("errors if there are no metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectError(
      () => persistenceManager.deleteLayout(existingId),
      `No metadata with ID ${existingId}; Non-unique layout with ID ${existingId}`
    );
  });
});

describe("loadLayout", () => {
  it("retrieves a persisted layout", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout]);

    const retrievedLayout = await persistenceManager.loadLayout(existingId);

    expect(retrievedLayout).toEqual(existingLayout.json);
  });

  it("retrieves layout if there is no metadata in local storage with requested ID ", async () => {
    saveLocalEntity(layoutsSaveLocation, [existingLayout]);

    const retrievedLayout = await persistenceManager.loadLayout(existingId);

    expect(retrievedLayout).toEqual(existingLayout.json);
  });

  it("errors if there is no layout in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);

    expectError(
      () => persistenceManager.loadLayout(existingId),
      `No layout with ID ${existingId}`
    );
  });

  it("errors if there is no metadata or layout in local storage with requested ID ", async () => {
    const requestedId = "non_existent_id";

    expectError(
      () => persistenceManager.loadLayout(requestedId),
      `No layout with ID ${requestedId}`
    );
  });

  it("retrieves layout if there are multiple metadata entries in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout]);

    const retrievedLayout = await persistenceManager.loadLayout(existingId);

    expect(retrievedLayout).toEqual(existingLayout.json);
  });

  it("errors if there are multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectError(
      () => persistenceManager.loadLayout(existingId),
      `Non-unique layout with ID ${existingId}`
    );
  });

  it("errors if there are multiple metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectError(
      () => persistenceManager.loadLayout(existingId),
      `Non-unique layout with ID ${existingId}`
    );
  });

  it("errors if there are multiple metadata entries and no layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);

    expectError(
      () => persistenceManager.loadLayout(existingId),
      `No layout with ID ${existingId}`
    );
  });

  it("errors if there are no metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectError(
      () => persistenceManager.loadLayout(existingId),
      `Non-unique layout with ID ${existingId}`
    );
  });
});

describe("loadMetadata", () => {
  it("retrieves array of persisted layout metadata", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);

    const retrievedMetadata = await persistenceManager.loadMetadata();

    expect(retrievedMetadata).toEqual([existingMetadata]);
  });

  it("retrieves array of all persisted layout metadata", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);

    const retrievedMetadata = await persistenceManager.loadMetadata();

    expect(retrievedMetadata).toEqual([existingMetadata, existingMetadata]);
  });

  it("returns empty array if no metadata is persisted", async () => {
    expect(await persistenceManager.loadMetadata()).toEqual([]);
  });
});

const expectError = (f: () => Promise<unknown>, message: string) => {
  expect(f).rejects.toStrictEqual(new Error(message));
};
