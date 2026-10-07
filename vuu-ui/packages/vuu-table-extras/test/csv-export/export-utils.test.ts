import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  DataSource,
  DataSourceRow,
} from "@vuu-ui/vuu-data-types";
import {
  exportCsvTemplate,
  exportSessionTableToCsv,
  exportToCsv,
} from "../../src/csv-export/export-utils";

describe("export-utils", () => {
  let mockSessionDataSource: {
    table: { module: string; table: string };
    status: string;
    subscribe: ReturnType<typeof vi.fn>;
    unsubscribe: ReturnType<typeof vi.fn>;
  };

  let mockDataSource: {
    table: { module: string; table: string };
    status: string;
    tableSchema: { columns: { name: string; serverDataType: string }[] };
    createSessionDataSource: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // 10 metadata elements followed by columns: ric, currency, description, vuuRowNum
    const metadata: DataSourceRow = [
      0,
      1,
      false, // IS_LEAF
      false, // IS_EXPANDED
      0,
      0,
      "key1",
      0, // SELECTED
      0,
      false, // IS_NEW
    ];
    const metadata2: DataSourceRow = [
      1,
      2,
      false, // IS_LEAF
      false, // IS_EXPANDED
      0,
      0,
      "key2",
      0, // SELECTED
      0,
      false, // IS_NEW
    ];

    mockSessionDataSource = {
      table: { module: "SIMUL", table: "session-123" },
      status: "subscribed",
      subscribe: vi.fn((_props: unknown, callback: (msg: unknown) => void) => {
        callback({
          type: "subscribed",
          columns: ["ric", "currency", "description", "vuuRowNum"],
        });
        callback({
          type: "viewport-update",
          mode: "size-only",
          size: 2,
        });
        callback({
          type: "viewport-update",
          mode: "batch",
          rows: [
            [...metadata, "VOD.L", "GBP", "Vodafone", 1],
            [...metadata2, "BP.L", "GBP", "BP", 2],
          ],
        });
      }),
      unsubscribe: vi.fn(),
    };

    mockDataSource = {
      table: { module: "SIMUL", table: "instruments" },
      status: "subscribed",
      tableSchema: {
        columns: [
          { name: "ric", serverDataType: "string" },
          { name: "currency", serverDataType: "string" },
          { name: "description", serverDataType: "string" },
        ],
      },
      createSessionDataSource: vi.fn().mockResolvedValue(mockSessionDataSource),
    };

    // mock DOM elements for triggerCsvDownload
    vi.stubGlobal(
      "Blob",
      vi.fn(function (
        this: { content: BlobPart[] },
        content: BlobPart[],
      ) {
        this.content = content;
      }),
    );
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
  });

  describe("exportToCsv with options object", () => {
    it("supports exporting via options object", async () => {
      const onSuccess = vi.fn();
      await exportToCsv(mockDataSource as unknown as DataSource, {
        filename: "test.csv",
        copyOption: "Selected",
        onSuccess,
      });

      expect(mockDataSource.createSessionDataSource).toHaveBeenCalledWith(
        "Selected",
        "export",
        undefined,
      );
      expect(mockSessionDataSource.subscribe).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });

    it("supports column descriptors with custom formatters and properly escapes quotes and special chars", async () => {
      let csvContent = "";
      vi.stubGlobal(
        "Blob",
        vi.fn(function (
          this: { content: BlobPart[] },
          content: BlobPart[],
        ) {
          csvContent = content[0] as string;
        }),
      );

      mockSessionDataSource.subscribe.mockImplementation(
        (_props: unknown, callback: (msg: unknown) => void) => {
          callback({
            type: "subscribed",
            columns: ["ric", "currency", "description", "vuuRowNum"],
          });
          callback({
            type: "viewport-update",
            mode: "size-only",
            size: 1,
          });
          callback({
            type: "viewport-update",
            mode: "batch",
            rows: [
              [
                0,
                0,
                false,
                false,
                0,
                0,
                "key0",
                false,
                0,
                false,
                'VOD, "UK"',
                "GBP",
                "Vodafone\nGroup",
                1,
              ],
            ],
          });
        },
      );

      await exportToCsv(mockDataSource as unknown as DataSource, {
        filename: "formatted.csv",
        columnDescriptors: [
          { name: "ric", label: "RIC, Code" },
          { name: "currency", exportFormatter: (v) => `${v}-CURR` },
          { name: "description" },
        ],
      });

      expect(csvContent).toContain('"RIC, Code",currency,description');
      expect(csvContent).toContain('"VOD, ""UK""",GBP-CURR,"Vodafone\nGroup"');
    });

    it("downloads a header-only CSV when there are 0 records", async () => {
      let csvContent = "";
      vi.stubGlobal(
        "Blob",
        vi.fn(function (
          this: { content: BlobPart[] },
          content: BlobPart[],
        ) {
          csvContent = content[0] as string;
        }),
      );

      mockSessionDataSource.subscribe.mockImplementation(
        (_props: unknown, callback: (msg: unknown) => void) => {
          callback({
            type: "subscribed",
            columns: ["ric", "currency", "description", "vuuRowNum"],
          });
          callback({
            type: "viewport-update",
            mode: "size-only",
            size: 0,
          });
        },
      );

      const onSuccess = vi.fn();
      await exportToCsv(mockDataSource as unknown as DataSource, {
        filename: "empty.csv",
        onSuccess,
      });

      expect(csvContent).toBe("ric,currency,description\r\n");
      expect(onSuccess).toHaveBeenCalled();
      expect(mockSessionDataSource.unsubscribe).toHaveBeenCalled();
    });

    it("assembles rows in correct order even when batches arrive out of order", async () => {
      let csvContent = "";
      vi.stubGlobal(
        "Blob",
        vi.fn(function (
          this: { content: BlobPart[] },
          content: BlobPart[],
        ) {
          csvContent = content[0] as string;
        }),
      );

      const metadataRow0: DataSourceRow = [
        0,
        0,
        false,
        false,
        0,
        0,
        "key0",
        0,
        0,
        false,
      ];
      const metadataRow1: DataSourceRow = [
        1,
        1,
        false,
        false,
        0,
        0,
        "key1",
        0,
        0,
        false,
      ];

      mockSessionDataSource.subscribe.mockImplementation(
        (_props: unknown, callback: (msg: unknown) => void) => {
          callback({
            type: "subscribed",
            columns: ["ric", "currency", "description", "vuuRowNum"],
          });
          callback({
            type: "viewport-update",
            mode: "size-only",
            size: 2,
          });
          // Send row 1 first in batch 1, then row 0 in batch 2
          callback({
            type: "viewport-update",
            mode: "batch",
            rows: [[...metadataRow1, "BP.L", "GBP", "BP", 2]],
          });
          callback({
            type: "viewport-update",
            mode: "batch",
            rows: [[...metadataRow0, "VOD.L", "GBP", "Vodafone", 1]],
          });
        },
      );

      const onSuccess = vi.fn();
      await exportToCsv(mockDataSource as unknown as DataSource, {
        filename: "out-of-order.csv",
        onSuccess,
      });

      const lines = csvContent.split("\r\n").filter(Boolean);
      expect(lines[0]).toBe("ric,currency,description");
      expect(lines[1]).toBe("VOD.L,GBP,Vodafone");
      expect(lines[2]).toBe("BP.L,GBP,BP");
      expect(onSuccess).toHaveBeenCalled();
    });

    it("rejects when row count exceeds maxRows", async () => {
      const onError = vi.fn();
      await exportToCsv(mockDataSource as unknown as DataSource, {
        maxRows: 1,
        onError,
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("exceeds the 1 row limit"),
        }),
      );

      // Also verify it rejects when onError is omitted
      await expect(
        exportToCsv(mockDataSource as unknown as DataSource, {
          maxRows: 1,
        }),
      ).rejects.toThrow("exceeds the 1 row limit");
    });

    it("rejects when export times out", async () => {
      mockSessionDataSource.subscribe.mockImplementation(() => {
        // never send messages to simulate a hang
      });

      await expect(
        exportToCsv(mockDataSource as unknown as DataSource, {
          timeout: 20,
        }),
      ).rejects.toThrow("timed out");
    });
  });

  describe("status checks", () => {
    it("throws or calls onError when dataSource is not subscribed (status = initialising)", async () => {
      const uninitializedDs = {
        isRemote: true,
        table: { module: "SIMUL", table: "instruments" },
        status: "initialising",
        createSessionDataSource: vi.fn(),
      };

      const onError = vi.fn();
      await exportToCsv(uninitializedDs as unknown as DataSource, {
        onError,
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("dataSource must be subscribed before exporting"),
        }),
      );
      expect(uninitializedDs.createSessionDataSource).not.toHaveBeenCalled();
    });

    it("throws when onError is omitted and status is unsubscribed", async () => {
      const uninitializedDs = {
        isRemote: true,
        table: { module: "SIMUL", table: "instruments" },
        status: "unsubscribed",
        createSessionDataSource: vi.fn(),
      };

      await expect(
        exportToCsv(uninitializedDs as unknown as DataSource, { filename: "test.csv" }),
      ).rejects.toThrow("dataSource must be subscribed before exporting");
    });
  });

  describe("exportCsvTemplate with options object", () => {
    it("exports template with options object and triggers onSuccess", async () => {
      mockSessionDataSource.subscribe.mockImplementation(
        (_props: unknown, callback: (msg: unknown) => void) => {
          callback({
            type: "subscribed",
            columns: ["ric", "currency", "description"],
          });
        },
      );

      const onSuccess = vi.fn();
      await exportCsvTemplate(mockDataSource as unknown as DataSource, {
        filename: "my-template.csv",
        excludeColumns: ["description"],
        onSuccess,
      });

      expect(mockDataSource.createSessionDataSource).toHaveBeenCalledWith(
        "Empty",
        "export",
        undefined,
      );
      expect(onSuccess).toHaveBeenCalled();
    });

    it("respects columns option in template export even if sessionDataSource returns additional columns", async () => {
      let csvContent = "";
      vi.stubGlobal(
        "Blob",
        vi.fn(function (
          this: { content: BlobPart[] },
          content: BlobPart[],
        ) {
          csvContent = content[0] as string;
        }),
      );

      mockSessionDataSource.subscribe.mockImplementation(
        (_props: unknown, callback: (msg: unknown) => void) => {
          callback({
            type: "subscribed",
            columns: ["ric", "currency", "description", "vuuRowNum"],
          });
        },
      );

      const onSuccess = vi.fn();
      await exportCsvTemplate(mockDataSource as unknown as DataSource, {
        filename: "selective-template.csv",
        columns: ["ric", "currency"],
        onSuccess,
      });

      expect(mockDataSource.createSessionDataSource).toHaveBeenCalledWith(
        "Empty",
        "export",
        { columns: ["ric", "currency"] },
      );
      expect(csvContent).toBe("ric,currency\r\n");
      expect(onSuccess).toHaveBeenCalled();
    });

    it("handles no columns available in session table path", async () => {
      mockSessionDataSource.subscribe.mockImplementation(
        (_props: unknown, callback: (msg: unknown) => void) => {
          callback({
            type: "subscribed",
            columns: ["vuuRowNum"],
          });
        },
      );

      const onError = vi.fn();
      await exportCsvTemplate(mockDataSource as unknown as DataSource, {
        onError,
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("no columns available for export"),
        }),
      );
    });

    it("falls back to tableSchema if status is initialising and triggers onSuccess", async () => {
      const uninitializedDs = {
        table: { module: "SIMUL", table: "instruments" },
        status: "initialising",
        tableSchema: {
          columns: [
            { name: "ric", serverDataType: "string" },
            { name: "currency", serverDataType: "string" },
          ],
        },
        createSessionDataSource: vi.fn(),
      };

      const onSuccess = vi.fn();
      await exportCsvTemplate(uninitializedDs as unknown as DataSource, {
        filename: "schema-template.csv",
        onSuccess,
      });

      expect(uninitializedDs.createSessionDataSource).not.toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });

    it("handles missing tableSchema via onError or throw in fallback path", async () => {
      const brokenDs = {
        table: { module: "SIMUL", table: "instruments" },
        status: "initialising",
        createSessionDataSource: vi.fn(),
      };

      const onError = vi.fn();
      await exportCsvTemplate(brokenDs as unknown as DataSource, {
        onError,
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("tableSchema not available"),
        }),
      );

      await expect(
        exportCsvTemplate(brokenDs as unknown as DataSource),
      ).rejects.toThrow("tableSchema not available");
    });

    it("handles empty export columns via onError or throw in fallback path", async () => {
      const noColumnsDs = {
        table: { module: "SIMUL", table: "instruments" },
        status: "initialising",
        tableSchema: {
          columns: [{ name: "vuuRowNum", serverDataType: "string" }],
        },
        createSessionDataSource: vi.fn(),
      };

      const onError = vi.fn();
      await exportCsvTemplate(noColumnsDs as unknown as DataSource, {
        onError,
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("no columns available for export"),
        }),
      );

      await expect(
        exportCsvTemplate(noColumnsDs as unknown as DataSource),
      ).rejects.toThrow("no columns available for export");
    });
  });

  describe("exportSessionTableToCsv with options object", () => {
    it("exports existing session table directly without calling createSessionDataSource", async () => {
      const onSuccess = vi.fn();
      await exportSessionTableToCsv(
        mockSessionDataSource as unknown as DataSource,
        {
          filename: "session-direct.csv",
          onSuccess,
        },
      );

      expect(mockSessionDataSource.subscribe).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe("client columns and formatting", () => {
    it("supports client columns (source = 'client') using exportFormatter and rowAccessor proxy", async () => {
      let csvContent = "";
      vi.stubGlobal(
        "Blob",
        vi.fn(function (
          this: { content: BlobPart[] },
          content: BlobPart[],
        ) {
          csvContent = content[0] as string;
        }),
      );

      await exportToCsv(mockDataSource as unknown as DataSource, {
        filename: "client-columns.csv",
        columns: [
          { name: "ric" },
          {
            name: "ricAndCurrency",
            source: "client",
            label: "RIC / CCY",
            exportFormatter: (_, row) => `${row?.ric}/${row?.currency}`,
          },
          {
            name: "actions",
            source: "client",
            label: "Actions",
          },
        ],
      });

      const lines = csvContent.split("\r\n").filter(Boolean);
      // "actions" is automatically excluded because it is a client column without an exportFormatter
      expect(lines[0]).toBe("ric,RIC / CCY");
      expect(lines[1]).toBe("VOD.L,VOD.L/GBP");
      expect(lines[2]).toBe("BP.L,BP.L/GBP");
    });

    it("respects exportable: false to exclude server or client columns", async () => {
      let csvContent = "";
      vi.stubGlobal(
        "Blob",
        vi.fn(function (
          this: { content: BlobPart[] },
          content: BlobPart[],
        ) {
          csvContent = content[0] as string;
        }),
      );

      await exportToCsv(mockDataSource as unknown as DataSource, {
        filename: "exportable-false.csv",
        columns: [
          { name: "ric" },
          { name: "currency", exportable: false },
          {
            name: "computed",
            source: "client",
            exportable: false,
            exportFormatter: (_, row) => `${row?.ric}`,
          },
        ],
      });

      const lines = csvContent.split("\r\n").filter(Boolean);
      expect(lines[0]).toBe("ric");
      expect(lines[1]).toBe("VOD.L");
      expect(lines[2]).toBe("BP.L");
    });

    it("allows exportable: true to explicitly export a client column even without formatters", async () => {
      let csvContent = "";
      vi.stubGlobal(
        "Blob",
        vi.fn(function (
          this: { content: BlobPart[] },
          content: BlobPart[],
        ) {
          csvContent = content[0] as string;
        }),
      );

      await exportToCsv(mockDataSource as unknown as DataSource, {
        filename: "client-explicit.csv",
        columns: [
          { name: "ric" },
          {
            name: "placeholder",
            source: "client",
            exportable: true,
          },
        ],
      });

      const lines = csvContent.split("\r\n").filter(Boolean);
      expect(lines[0]).toBe("ric,placeholder");
      expect(lines[1]).toBe("VOD.L,");
      expect(lines[2]).toBe("BP.L,");
    });

    it("supports client columns with exportFormatter receiving rowAccessor", async () => {
      let csvContent = "";
      vi.stubGlobal(
        "Blob",
        vi.fn(function (
          this: { content: BlobPart[] },
          content: BlobPart[],
        ) {
          csvContent = content[0] as string;
        }),
      );

      await exportToCsv(mockDataSource as unknown as DataSource, {
        filename: "client-formatter.csv",
        columns: [
          {
            name: "computed",
            source: "client",
            label: "Formatted Column",
            exportFormatter: (_val, row) => `CURR_${row?.currency}`,
          },
          { name: "ric" },
        ],
      });

      const lines = csvContent.split("\r\n").filter(Boolean);
      expect(lines[0]).toBe("Formatted Column,ric");
      expect(lines[1]).toBe("CURR_GBP,VOD.L");
      expect(lines[2]).toBe("CURR_GBP,BP.L");
    });

    it("automatically applies table getValueFormatter for formatted columns", async () => {
      let csvContent = "";
      vi.stubGlobal(
        "Blob",
        vi.fn(function (
          this: { content: BlobPart[] },
          content: BlobPart[],
        ) {
          csvContent = content[0] as string;
        }),
      );

      mockSessionDataSource.subscribe.mockImplementation(
        (_props: unknown, callback: (msg: unknown) => void) => {
          callback({
            type: "subscribed",
            columns: ["ric", "price", "vuuRowNum"],
          });
          callback({
            type: "viewport-update",
            mode: "size-only",
            size: 1,
          });
          callback({
            type: "viewport-update",
            mode: "batch",
            rows: [
              [0, 0, false, false, 0, 0, "key0", false, 0, false, "VOD.L", 12.3, 1],
            ],
          });
        },
      );

      await exportToCsv(mockDataSource as unknown as DataSource, {
        filename: "formatted-types.csv",
        columns: [
          { name: "ric" },
          {
            name: "price",
            serverDataType: "double",
            type: {
              name: "number",
              formatting: { decimals: 2, zeroPad: true, useLocaleString: false },
            },
          },
        ],
      });

      const lines = csvContent.split("\r\n").filter(Boolean);
      expect(lines[0]).toBe("ric,price");
      expect(lines[1]).toBe("VOD.L,12.30");
    });

    it("preserves explicit column order and filters out hidden columns", async () => {
      let csvContent = "";
      vi.stubGlobal(
        "Blob",
        vi.fn(function (
          this: { content: BlobPart[] },
          content: BlobPart[],
        ) {
          csvContent = content[0] as string;
        }),
      );

      await exportToCsv(mockDataSource as unknown as DataSource, {
        filename: "reordered.csv",
        columns: [
          { name: "description" },
          {
            name: "clientTag",
            source: "client",
            exportFormatter: (_, row) => `TAG_${row?.ric}`,
          },
          { name: "currency", hidden: true },
          { name: "ric" },
        ],
      });

      const lines = csvContent.split("\r\n").filter(Boolean);
      expect(lines[0]).toBe("description,clientTag,ric");
      expect(lines[1]).toBe("Vodafone,TAG_VOD.L,VOD.L");
      expect(lines[2]).toBe("BP,TAG_BP.L,BP.L");
    });

    it("exportCsvTemplate filters out client columns and hidden columns when ColumnDescriptor array is passed", async () => {
      mockSessionDataSource.subscribe.mockImplementation(
        (_props: unknown, callback: (msg: unknown) => void) => {
          callback({
            type: "subscribed",
            columns: ["ric"],
          });
        },
      );

      const onSuccess = vi.fn();
      await exportCsvTemplate(mockDataSource as unknown as DataSource, {
        filename: "safe-template.csv",
        columns: [
          { name: "ric" },
          { name: "actionButton", source: "client" },
          { name: "currency", hidden: true },
        ],
        onSuccess,
      });

      expect(mockDataSource.createSessionDataSource).toHaveBeenCalledWith(
        "Empty",
        "export",
        { columns: ["ric"] },
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
