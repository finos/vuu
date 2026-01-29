import "@vuu-ui/vuu-layout/test/global-mocks";
import {
  Layout,
  LayoutJSON,
  LayoutMetadata,
  LayoutMetadataDto,
  formatDate,
  getLocalEntity,
  saveLocalEntity,
} from "@vuu-ui/vuu-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalPersistenceManager } from "../../src/persistence-manager/LocalPersistenceManager";

const expectPromiseRejectsWithError = (
  f: () => Promise<unknown>,
  message: string,
) => {
  return expect(f).rejects.toStrictEqual(new Error(message));
};

const username = "vuu_user";

vi.mock("../../src/login/login-utils", async () => {
  return {
    getAuthDetailsFromCookies: (): [string, string] => {
      console.log(`getAuthDetailsFromCookie`);
      return [username, "token"];
    },
  };
});

const persistenceManager = new LocalPersistenceManager(username);

const existingId = "existing_id";

const newDate = formatDate({ date: "dd.mm.yyyy" })(new Date());

const existingMetadata: LayoutMetadata = {
  id: existingId,
  name: "Existing Layout",
  group: "Group 1",
  screenshot: "screenshot",
  user: username,
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
  user: username,
};

const metadataToUpdate: Omit<LayoutMetadata, "id"> = {
  name: "New Layout",
  group: "Group 1",
  screenshot: "screenshot",
  user: username,
  created: newDate,
};

const layoutToAdd: LayoutJSON = {
  type: "t",
};

const metadataSaveLocation = `layouts/metadata/${username}`;
const layoutsSaveLocation = `layouts/layouts/${username}`;

afterEach(() => {
  localStorage.clear();
});

describe("createLayout", () => {
  it("persists to local storage with a unique ID and current date", async () => {
    const { id, created } = await persistenceManager.createLayout(
      metadataToAdd,
      layoutToAdd,
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
      layoutToAdd,
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
      layoutToAdd,
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

    await expectPromiseRejectsWithError(
      () =>
        persistenceManager.updateLayout(
          existingId,
          metadataToUpdate,
          layoutToAdd,
        ),
      `No metadata with ID ${existingId}`,
    );
  });

  it("errors if there is no layout in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);

    await expectPromiseRejectsWithError(
      () =>
        persistenceManager.updateLayout(
          existingId,
          metadataToUpdate,
          layoutToAdd,
        ),
      `No layout with ID ${existingId}`,
    );
  });

  it("errors if there is no metadata or layout in local storage with requested ID ", async () => {
    const requestedId = "non_existent_id";

    await expectPromiseRejectsWithError(
      () =>
        persistenceManager.updateLayout(
          requestedId,
          metadataToUpdate,
          layoutToAdd,
        ),
      `No metadata with ID ${requestedId}; No layout with ID ${requestedId}`,
    );
  });

  it("errors if there are multiple metadata entries in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout]);

    await expectPromiseRejectsWithError(
      () =>
        persistenceManager.updateLayout(
          existingId,
          metadataToUpdate,
          layoutToAdd,
        ),
      `Non-unique metadata with ID ${existingId}`,
    );
  });

  it("errors if there are multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    await expectPromiseRejectsWithError(
      () =>
        persistenceManager.updateLayout(
          existingId,
          metadataToUpdate,
          layoutToAdd,
        ),
      `Non-unique layout with ID ${existingId}`,
    );
  });

  it("errors if there are multiple metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    await expectPromiseRejectsWithError(
      () =>
        persistenceManager.updateLayout(
          existingId,
          metadataToUpdate,
          layoutToAdd,
        ),
      `Non-unique metadata with ID ${existingId}; Non-unique layout with ID ${existingId}`,
    );
  });

  it("errors if there are multiple metadata entries and no layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);

    await expectPromiseRejectsWithError(
      () =>
        persistenceManager.updateLayout(
          existingId,
          metadataToUpdate,
          layoutToAdd,
        ),
      `Non-unique metadata with ID ${existingId}; No layout with ID ${existingId}`,
    );
  });

  it("errors if there are no metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    await expectPromiseRejectsWithError(
      () =>
        persistenceManager.updateLayout(
          existingId,
          metadataToUpdate,
          layoutToAdd,
        ),
      `No metadata with ID ${existingId}; Non-unique layout with ID ${existingId}`,
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

    await expectPromiseRejectsWithError(
      () => persistenceManager.deleteLayout(existingId),
      `No metadata with ID ${existingId}`,
    );
  });

  it("errors if there is no layout in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);

    await expectPromiseRejectsWithError(
      () => persistenceManager.deleteLayout(existingId),
      `No layout with ID ${existingId}`,
    );
  });

  it("errors if there is no metadata or layout in local storage with requested ID ", async () => {
    const requestedId = "non_existent_id";

    await expectPromiseRejectsWithError(
      () => persistenceManager.deleteLayout(requestedId),
      `No metadata with ID ${requestedId}; No layout with ID ${requestedId}`,
    );
  });

  it("errors if there are multiple metadata entries in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout]);

    await expectPromiseRejectsWithError(
      () => persistenceManager.deleteLayout(existingId),
      `Non-unique metadata with ID ${existingId}`,
    );
  });

  it("errors if there are multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    await expectPromiseRejectsWithError(
      () => persistenceManager.deleteLayout(existingId),
      `Non-unique layout with ID ${existingId}`,
    );
  });

  it("errors if there are multiple metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    await expectPromiseRejectsWithError(
      () => persistenceManager.deleteLayout(existingId),
      `Non-unique metadata with ID ${existingId}; Non-unique layout with ID ${existingId}`,
    );
  });

  it("errors if there are multiple metadata entries and no layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);

    await expectPromiseRejectsWithError(
      () => persistenceManager.deleteLayout(existingId),
      `Non-unique metadata with ID ${existingId}; No layout with ID ${existingId}`,
    );
  });

  it("errors if there are no metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    await expectPromiseRejectsWithError(
      () => persistenceManager.deleteLayout(existingId),
      `No metadata with ID ${existingId}; Non-unique layout with ID ${existingId}`,
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

    await expectPromiseRejectsWithError(
      () => persistenceManager.loadLayout(existingId),
      `No layout with ID ${existingId}`,
    );
  });

  it("errors if there is no metadata or layout in local storage with requested ID ", async () => {
    const requestedId = "non_existent_id";

    await expectPromiseRejectsWithError(
      () => persistenceManager.loadLayout(requestedId),
      `No layout with ID ${requestedId}`,
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

    await expectPromiseRejectsWithError(
      () => persistenceManager.loadLayout(existingId),
      `Non-unique layout with ID ${existingId}`,
    );
  });

  it("errors if there are multiple metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    await expectPromiseRejectsWithError(
      () => persistenceManager.loadLayout(existingId),
      `Non-unique layout with ID ${existingId}`,
    );
  });

  it("errors if there are multiple metadata entries and no layouts in local storage with requested ID ", async () => {
    saveLocalEntity(metadataSaveLocation, [existingMetadata, existingMetadata]);

    await expectPromiseRejectsWithError(
      () => persistenceManager.loadLayout(existingId),
      `No layout with ID ${existingId}`,
    );
  });

  it("errors if there are no metadata entries and multiple layouts in local storage with requested ID ", async () => {
    saveLocalEntity(layoutsSaveLocation, [existingLayout, existingLayout]);

    await expectPromiseRejectsWithError(
      () => persistenceManager.loadLayout(existingId),
      `Non-unique layout with ID ${existingId}`,
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
