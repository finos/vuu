import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GetLayoutResponseDto,
  CreateLayoutResponseDto,
  RemoteLayoutPersistenceManager,
} from "../../src/layout-persistence/RemoteLayoutPersistenceManager";
import { LayoutMetadata, LayoutMetadataDto } from "@finos/vuu-shell";
import { LayoutJSON } from "../../src/layout-reducer";
import { v4 as uuidv4 } from "uuid";
import { expectPromiseRejectsWithError } from "@finos/vuu-utils/test/utils";

const persistence = new RemoteLayoutPersistenceManager();
const mockFetch = vi.fn();

global.fetch = mockFetch;

const metadata: LayoutMetadata = {
  id: "0001",
  name: "layout 1",
  group: "group 1",
  screenshot: "screenshot",
  user: "username",
  created: "01.01.2000",
};

const metadataToAdd: LayoutMetadataDto = {
  name: "layout 1",
  group: "group 1",
  screenshot: "screenshot",
  user: "username",
};

const layout: LayoutJSON = {
  type: "View",
};

const uniqueId = uuidv4();
const dateString = new Date().toISOString();
const fetchError = new Error("Something went wrong with your request");

type FetchResponse<T> = {
  json?: () => Promise<T>;
  ok: boolean;
  statusText?: string;
};

describe("RemoteLayoutPersistenceManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createLayout", () => {
    const responseJSON: CreateLayoutResponseDto = {
      metadata: {
        ...metadataToAdd,
        id: uniqueId,
        created: dateString,
      },
    };

    it("resolves with metadata when fetch resolves, response is ok and contains metadata", () => {
      const fetchResponse: FetchResponse<CreateLayoutResponseDto> = {
        json: () => new Promise((resolve) => resolve(responseJSON)),
        ok: true,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      const result = persistence.createLayout(metadataToAdd, layout);

      expect(result).resolves.toStrictEqual(responseJSON.metadata);
    });

    it("rejects with error when response is not ok", () => {
      const errorMessage = "Not Found";

      const fetchResponse: FetchResponse<CreateLayoutResponseDto> = {
        json: () => new Promise((resolve) => resolve(responseJSON)),
        ok: false,
        statusText: errorMessage,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      expectPromiseRejectsWithError(
        () => persistence.createLayout(metadata, layout),
        errorMessage
      );
    });

    it("rejects with error when metadata in response is falsey", () => {
      const fetchResponse: FetchResponse<object> = {
        json: () => new Promise((resolve) => resolve({})),
        ok: true,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      expectPromiseRejectsWithError(
        () => persistence.createLayout(metadata, layout),
        "Response did not contain valid metadata"
      );
    });

    it("rejects with error when fetch rejects", () => {
      mockFetch.mockRejectedValue(fetchError);

      expectPromiseRejectsWithError(
        () => persistence.createLayout(metadata, layout),
        fetchError.message
      );
    });
  });

  describe("updateLayout", () => {
    it("resolves when fetch resolves and response is ok", () => {
      const fetchResponse: FetchResponse<void> = {
        ok: true,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      const result = persistence.updateLayout(uniqueId, metadata, layout);

      expect(result).resolves.toBe(undefined);
    });

    it("rejects with error when response is not ok", () => {
      const errorMessage = "Not Found";

      const fetchResponse: FetchResponse<void> = {
        ok: false,
        statusText: errorMessage,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      expectPromiseRejectsWithError(
        () => persistence.updateLayout(uniqueId, metadata, layout),
        errorMessage
      );
    });

    it("rejects with error when fetch rejects", () => {
      mockFetch.mockRejectedValue(fetchError);

      expectPromiseRejectsWithError(
        () => persistence.updateLayout(uniqueId, metadata, layout),
        fetchError.message
      );
    });
  });

  describe("deleteLayout", () => {
    it("resolves when fetch resolves and response is ok", () => {
      const fetchResponse: FetchResponse<void> = {
        ok: true,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      const result = persistence.deleteLayout(uniqueId);

      expect(result).resolves.toBe(undefined);
    });

    it("rejects with error when response is not ok", () => {
      const errorMessage = "Not Found";

      const fetchResponse: FetchResponse<void> = {
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
      const responseJson = [metadata];

      const fetchResponse: FetchResponse<LayoutMetadata[]> = {
        json: () => new Promise((resolve) => resolve(responseJson)),
        ok: true,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      const result = persistence.loadMetadata();

      expect(result).resolves.toBe(responseJson);
    });

    it("rejects with error when response is not ok", () => {
      const errorMessage = "Not Found";

      const fetchResponse: FetchResponse<void> = {
        json: () => new Promise((resolve) => resolve()),
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
      const fetchResponse: FetchResponse<void> = {
        json: () => new Promise((resolve) => resolve()),
        ok: true,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      expectPromiseRejectsWithError(
        () => persistence.loadMetadata(),
        "Response did not contain valid metadata"
      );
    });

    it("rejects with error when fetch rejects", () => {
      mockFetch.mockRejectedValue(fetchError);

      expectPromiseRejectsWithError(
        () => persistence.loadMetadata(),
        fetchError.message
      );
    });
  });

  describe("loadLayout", () => {
    it("resolves with array of metadata when response is ok", () => {
      const fetchResponse: FetchResponse<GetLayoutResponseDto> = {
        json: () => new Promise((resolve) => resolve({ definition: layout })),
        ok: true,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      const result = persistence.loadLayout(uniqueId);

      expect(result).resolves.toBe(layout);
    });

    it("rejects with error when response is not ok", () => {
      const errorMessage = "Not Found";

      const fetchResponse: FetchResponse<object> = {
        json: () => new Promise((resolve) => resolve({})),
        ok: false,
        statusText: errorMessage,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      expectPromiseRejectsWithError(
        () => persistence.loadLayout(uniqueId),
        errorMessage
      );
    });

    it("rejects with error when definition is falsey in response", () => {
      const fetchResponse: FetchResponse<object> = {
        json: () => new Promise((resolve) => resolve({})),
        ok: true,
      };

      mockFetch.mockResolvedValue(fetchResponse);

      expectPromiseRejectsWithError(
        () => persistence.loadLayout(uniqueId),
        "Response did not contain a valid layout"
      );
    });

    it("rejects with error when fetch rejects", () => {
      mockFetch.mockRejectedValue(fetchError);

      expectPromiseRejectsWithError(
        () => persistence.loadLayout(uniqueId),
        fetchError.message
      );
    });
  });
});
