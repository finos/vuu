import { beforeEach, describe, expect, it, vi } from "vitest";
import { RemoteLayoutPersistenceManager } from "../../src/layout-persistence/RemoteLayoutPersistenceManager";
import { LayoutMetadata } from "@finos/vuu-shell";
import { LayoutJSON } from "../../src/layout-reducer";
import { v4 as uuidv4 } from "uuid";
import { expectPromiseRejectsWithError } from "./utils";

const persistence = new RemoteLayoutPersistenceManager();
const mockFetch = vi.fn();

global.fetch = mockFetch;

const metadata: LayoutMetadata[] = [
  {
    id: "0001",
    name: "layout 1",
    group: "group 1",
    screenshot: "",
    user: "username",
    created: "01.01.2000",
  },
];

const metadataToAdd: Omit<LayoutMetadata, "id" | "created"> = {
  name: "layout 1",
  group: "group 1",
  screenshot: "",
  user: "username",
};

const layout: LayoutJSON = {
  type: "",
};

const uniqueId = uuidv4();
const dateString = new Date().toISOString();
const fetchError = new Error("Something went wrong with your request")

describe("RemoteLayoutPersistenceManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createLayout", () => {
    const responseJSON = {
      metadata: {
        ...metadataToAdd,
        id: uniqueId,
        created: dateString,
      },
    };

    it("resolves with metadata when fetch resolves, response is ok and contains metadata", () => {
      const fetchResponse = {
        json: () => new Promise((resolve) => resolve(responseJSON)),
        ok: true,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      const result = persistence.createLayout(metadataToAdd, layout);

      expect(result).resolves.toStrictEqual(responseJSON.metadata);
    });

    it("rejects with error when response is not ok", () => {
      const errorMessage = "Not Found";

      const fetchResponse = {
        json: () => new Promise((resolve) => resolve(responseJSON)),
        ok: false,
        statusText: errorMessage,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      expectPromiseRejectsWithError(
        () => persistence.createLayout(metadata[0], layout),
        errorMessage
      );
    });

    it("rejects with error when metadata in response is falsey", () => {
      const fetchResponse = {
        json: () => new Promise((resolve) => resolve({})),
        ok: true,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      expectPromiseRejectsWithError(
        () => persistence.createLayout(metadata[0], layout),
        "Response did not contain valid metadata"
      );
    });

    it("rejects with error when fetch rejects", () => {
      mockFetch.mockRejectedValue(fetchError);

      expectPromiseRejectsWithError(
        () => persistence.createLayout(metadata[0], layout),
        fetchError.message
      );
    });
  });

  describe("updateLayout", () => {
    it("resolves when fetch resolves and response is ok", () => {
      const fetchResponse = {
        ok: true,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      const result = persistence.updateLayout(uniqueId, metadata[0], layout);

      expect(result).resolves.toBe(undefined);
    });

    it("rejects with error when response is not ok", () => {
      const errorMessage = "Not Found";

      const fetchResponse = {
        ok: false,
        statusText: errorMessage,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      expectPromiseRejectsWithError(
        () => persistence.updateLayout(uniqueId, metadata[0], layout),
        errorMessage
      );
    });

    it("rejects with error when fetch rejects", () => {
      mockFetch.mockRejectedValue(fetchError);

      expectPromiseRejectsWithError(
        () => persistence.updateLayout(uniqueId, metadata[0], layout),
        fetchError.message
      );
    });
  });

  describe("deleteLayout", () => {
    it("resolves when fetch resolves and response is ok", () => {
      const fetchResponse = {
        ok: true,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      const result = persistence.deleteLayout(uniqueId);

      expect(result).resolves.toBe(undefined);
    });

    it("rejects with error when response is not ok", () => {
      const errorMessage = "Not Found";

      const fetchResponse = {
        ok: false,
        statusText: errorMessage,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      expectPromiseRejectsWithError(
        () => persistence.deleteLayout(uniqueId),
        errorMessage
      );
    });

    it("rejects with error when fetch rejects", () => {
      mockFetch.mockRejectedValue(fetchError);

      expectPromiseRejectsWithError(
        () => persistence.deleteLayout(uniqueId),
        fetchError.message
      );
    });
  });

  describe("loadMetadata", () => {
    it("resolves with array of metadata when response is ok", () => {
      const persistence = new RemoteLayoutPersistenceManager();

      const fetchResponse = {
        json: () => new Promise((resolve) => resolve(metadata)),
        ok: true,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      const result = persistence.loadMetadata();

      expect(result).resolves.toBe(metadata);
    });

    it("rejects with error when response is not ok", () => {
      const persistence = new RemoteLayoutPersistenceManager();

      const errorMessage = "Not Found";

      const fetchResponse = {
        json: () => new Promise((resolve) => resolve(undefined)),
        ok: false,
        statusText: errorMessage,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      expectPromiseRejectsWithError(
        () => persistence.loadMetadata(),
        errorMessage
      );
    });

    it("rejects with error when metadata is falsey in response", () => {
      const persistence = new RemoteLayoutPersistenceManager();

      const fetchResponse = {
        json: () => new Promise((resolve) => resolve(undefined)),
        ok: true,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      expectPromiseRejectsWithError(
        () => persistence.loadMetadata(),
        "Response did not contain valid metadata"
      );
    });

    it("rejects with error when fetch rejects", () => {
      const persistence = new RemoteLayoutPersistenceManager();

      mockFetch.mockRejectedValue(fetchError);

      expectPromiseRejectsWithError(
        () => persistence.loadMetadata(),
        fetchError.message
      );
    });
  });

  describe("loadLayout", () => {
    it("resolves with array of metadata when response is ok", () => {
      const persistence = new RemoteLayoutPersistenceManager();

      const fetchResponse = {
        json: () => new Promise((resolve) => resolve(layout)),
        ok: true,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      const result = persistence.loadLayout(uniqueId);

      expect(result).resolves.toBe(layout);
    });

    it("rejects with error when response is not ok", () => {
      const persistence = new RemoteLayoutPersistenceManager();

      const errorMessage = "Not Found";

      const fetchResponse = {
        json: () => new Promise((resolve) => resolve(undefined)),
        ok: false,
        statusText: errorMessage,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      expectPromiseRejectsWithError(
        () => persistence.loadLayout(uniqueId),
        errorMessage
      );
    });

    it("rejects with error when metadata is falsey in response", () => {
      const persistence = new RemoteLayoutPersistenceManager();

      const fetchResponse = {
        json: () =>
          new Promise((resolve: (value?: unknown) => void) => resolve()),
        ok: true,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      expectPromiseRejectsWithError(
        () => persistence.loadLayout(uniqueId),
        "Response did not contain a valid layout"
      );
    });

    it("rejects with error when fetch rejects", () => {
      const persistence = new RemoteLayoutPersistenceManager();

      mockFetch.mockRejectedValue(fetchError);

      expectPromiseRejectsWithError(
        () => persistence.loadLayout(uniqueId),
        fetchError.message
      );
    });
  });
});
