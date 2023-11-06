import "../global-mocks";
import { Layout, LayoutMetadata, LayoutMetadataDto } from "@finos/vuu-shell";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalLayoutPersistenceManager } from "../../src/layout-persistence";
import { LayoutJSON } from "../../src/layout-reducer";
import {
  getLocalEntity,
  saveLocalEntity,
} from "../../../vuu-filters/src/local-config";
import { formatDate } from "@finos/vuu-utils";
import { expectPromiseRejectsWithError } from "./utils";

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

const newDate = formatDate(new Date(), "dd.mm.yyyy");

const existingMetadata: LayoutMetadata = {
  id: existingId,
  name: "Existing Layout",
  group: "Group 1",
  screenshot: "screenshot",
  user: "vuu user",
  created: newDate,
};

const existingLayout: Layout = {
  id: existingId,
  json: { type: "t0" },
};

const metadataToAdd: LayoutMetadataDto = {
  name: "New Layout",
  group: "Group 1",
  screenshot: "screenshot",
  user: "vuu user",
};

const metadataToUpdate: Omit<LayoutMetadata, "id"> = {
  name: "New Layout",
  group: "Group 1",
  screenshot: "screenshot",
  user: "vuu user",
  created: newDate,
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
  it("persists to local storage with a unique ID and current date", async () => {
    const { id, created } = await persistenceManager.createLayout(
      metadataToAdd,
      layoutToAdd
    );

    const persistedMetadata =
      getLocalEntity<LayoutMetadata[]>(metadataSaveLocation);
    const persistedLayout = getLocalEntity<Layout[]>(layoutsSaveLocation);

    const expectedMetadata: LayoutMetadata = {
      ...metadataToAdd,
      id,
      created,
    };

    const expectedLayout: Layout = {
      json: layoutToAdd,
      id,
    };

    expect(created).toEqual(newDate);
    expect(persistedMetadata).toEqual([expectedMetadata]);
    expect(persistedLayout).toEqual([expectedLayout]);
  });

  it("adds to existing storage", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout]);

    const { id, created } = await persistenceManager.createLayout(
      metadataToAdd,
      layoutToAdd
    );
    expect(id).not.toEqual(existingId);

    const persistedMetadata =
      getLocalEntity<LayoutMetadata[]>(metadataSaveLocation);
    const persistedLayout = getLocalEntity<Layout[]>(layoutsSaveLocation);

    const expectedMetadata: LayoutMetadata = {
      ...metadataToAdd,
      id,
      created,
    };

    const expectedLayout: Layout = {
      json: layoutToAdd,
      id,
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
      metadataToUpdate,
      layoutToAdd
    );

    const persistedMetadata =
      getLocalEntity<LayoutMetadata[]>(metadataSaveLocation);
    const persistedLayout = getLocalEntity<Layout[]>(layoutsSaveLocation);

    const expectedMetadata: LayoutMetadata = {
      ...metadataToUpdate,
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

    expectPromiseRejectsWithError(
      () =>
        persistenceManager.updateLayout(
          existingId,
          metadataToUpdate,
          layoutToAdd
        ),
      `No metadata with ID ${existingId}`
    );
  });

  it("errors if there is no layout in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);

    expectPromiseRejectsWithError(
      () =>
        persistenceManager.updateLayout(
          existingId,
          metadataToUpdate,
          layoutToAdd
        ),
      `No layout with ID ${existingId}`
    );
  });

  it("errors if there is no metadata or layout in local storage with requested ID ", async () => {
    const requestedId = "non_existent_id";

    expectPromiseRejectsWithError(
      () =>
        persistenceManager.updateLayout(
          requestedId,
          metadataToUpdate,
          layoutToAdd
        ),
      `No metadata with ID ${requestedId}; No layout with ID ${requestedId}`
    );
  });

  it("errors if there are multiple metadata entries in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout]);

    expectPromiseRejectsWithError(
      () =>
        persistenceManager.updateLayout(
          existingId,
          metadataToUpdate,
          layoutToAdd
        ),
      `Non-unique metadata with ID ${existingId}`
    );
  });

  it("errors if there are multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectPromiseRejectsWithError(
      () =>
        persistenceManager.updateLayout(
          existingId,
          metadataToUpdate,
          layoutToAdd
        ),
      `Non-unique layout with ID ${existingId}`
    );
  });

  it("errors if there are multiple metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectPromiseRejectsWithError(
      () =>
        persistenceManager.updateLayout(
          existingId,
          metadataToUpdate,
          layoutToAdd
        ),
      `Non-unique metadata with ID ${existingId}; Non-unique layout with ID ${existingId}`
    );
  });

  it("errors if there are multiple metadata entries and no layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);

    expectPromiseRejectsWithError(
      () =>
        persistenceManager.updateLayout(
          existingId,
          metadataToUpdate,
          layoutToAdd
        ),
      `Non-unique metadata with ID ${existingId}; No layout with ID ${existingId}`
    );
  });

  it("errors if there are no metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectPromiseRejectsWithError(
      () =>
        persistenceManager.updateLayout(
          existingId,
          metadataToUpdate,
          layoutToAdd
        ),
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

    expectPromiseRejectsWithError(
      () => persistenceManager.deleteLayout(existingId),
      `No metadata with ID ${existingId}`
    );
  });

  it("errors if there is no layout in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);

    expectPromiseRejectsWithError(
      () => persistenceManager.deleteLayout(existingId),
      `No layout with ID ${existingId}`
    );
  });

  it("errors if there is no metadata or layout in local storage with requested ID ", async () => {
    const requestedId = "non_existent_id";

    expectPromiseRejectsWithError(
      () => persistenceManager.deleteLayout(requestedId),
      `No metadata with ID ${requestedId}; No layout with ID ${requestedId}`
    );
  });

  it("errors if there are multiple metadata entries in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout]);

    expectPromiseRejectsWithError(
      () => persistenceManager.deleteLayout(existingId),
      `Non-unique metadata with ID ${existingId}`
    );
  });

  it("errors if there are multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectPromiseRejectsWithError(
      () => persistenceManager.deleteLayout(existingId),
      `Non-unique layout with ID ${existingId}`
    );
  });

  it("errors if there are multiple metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectPromiseRejectsWithError(
      () => persistenceManager.deleteLayout(existingId),
      `Non-unique metadata with ID ${existingId}; Non-unique layout with ID ${existingId}`
    );
  });

  it("errors if there are multiple metadata entries and no layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);

    expectPromiseRejectsWithError(
      () => persistenceManager.deleteLayout(existingId),
      `Non-unique metadata with ID ${existingId}; No layout with ID ${existingId}`
    );
  });

  it("errors if there are no metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectPromiseRejectsWithError(
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

    expectPromiseRejectsWithError(
      () => persistenceManager.loadLayout(existingId),
      `No layout with ID ${existingId}`
    );
  });

  it("errors if there is no metadata or layout in local storage with requested ID ", async () => {
    const requestedId = "non_existent_id";

    expectPromiseRejectsWithError(
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

    expectPromiseRejectsWithError(
      () => persistenceManager.loadLayout(existingId),
      `Non-unique layout with ID ${existingId}`
    );
  });

  it("errors if there are multiple metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectPromiseRejectsWithError(
      () => persistenceManager.loadLayout(existingId),
      `Non-unique layout with ID ${existingId}`
    );
  });

  it("errors if there are multiple metadata entries and no layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);

    expectPromiseRejectsWithError(
      () => persistenceManager.loadLayout(existingId),
      `No layout with ID ${existingId}`
    );
  });

  it("errors if there are no metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    expectPromiseRejectsWithError(
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
