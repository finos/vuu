import { getSchema, LocalDataSourceProvider, simulModule } from "@vuu-ui/vuu-data-test";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import { exportCsvTemplate, exportToCsv } from "@vuu-ui/vuu-utils";
import { Button } from "@salt-ds/core";
import { Table } from "@vuu-ui/vuu-table";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { useCallback, useMemo, useState } from "react";

const TABLE_NAME = "instruments";

const CsvExportContent = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<string | undefined>();

  const dataSource = useMemo(
    () => simulModule.createDataSource(TABLE_NAME),
    [],
  );

  const config = useMemo<TableConfig>(
    () => ({ columns: getSchema(TABLE_NAME).columns }),
    [],
  );

  const handleExportAll = useCallback(async () => {
    setIsExporting(true);
    setStatus(undefined);
    try {
      await exportToCsv(
        dataSource as DataSource,
        "All",
        "instruments-export.csv",
        [],
        (err) => { setStatus(`Export failed: ${err.message}`); setIsExporting(false); },
        () => { setStatus("Download started"); setIsExporting(false); },
      );
    } catch (e) {
      setStatus(`Export failed: ${(e as Error).message}`);
      setIsExporting(false);
    }
  }, [dataSource]);

  const handleExportSelected = useCallback(async () => {
    setIsExporting(true);
    setStatus(undefined);
    try {
      await exportToCsv(
        dataSource as DataSource,
        "Selected",
        "instruments-selected-export.csv",
        [],
        (err) => { setStatus(`Export failed: ${err.message}`); setIsExporting(false); },
        () => { setStatus("Download started"); setIsExporting(false); },
      );
    } catch (e) {
      setStatus(`Export failed: ${(e as Error).message}`);
      setIsExporting(false);
    }
  }, [dataSource]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        height: "100%",
        padding: 12,
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Button disabled={isExporting} onClick={handleExportAll}>
          Export All to CSV
        </Button>
        <Button disabled={isExporting} onClick={handleExportSelected}>
          Export Selected to CSV
        </Button>
        {status ? (
          <span style={{ fontSize: 12, color: "#027a48", fontWeight: 600 }}>
            {status}
          </span>
        ) : null}
      </div>
      <div style={{ flex: "1 1 0", border: "solid 1px lightgray" }}>
        <Table config={config} dataSource={dataSource} selectionModel="checkbox" />
      </div>
    </div>
  );
};

export const CsvExportAllRows = () => (
  <LocalDataSourceProvider>
    <CsvExportContent />
  </LocalDataSourceProvider>
);

const CsvExportSimpleContent = () => {
  const dataSource = useMemo(
    () => simulModule.createDataSource(TABLE_NAME),
    [],
  );

  const handleExport = useCallback(async () => {
    await exportToCsv(dataSource as DataSource, "All", "instruments.csv");
  }, [dataSource]);

  return (
    <div style={{ padding: 12 }}>
      <Button onClick={handleExport}>Download instruments.csv</Button>
    </div>
  );
};

export const CsvExportSimple = () => (
  <LocalDataSourceProvider>
    <CsvExportSimpleContent />
  </LocalDataSourceProvider>
);

const INSTRUMENTS_TEMPLATE_COLUMNS = ["ric", "currency", "description", "exchange", "isin"];

const CsvExportTemplateContent = () => {
  const dataSource = useMemo(
    () => simulModule.createDataSource(TABLE_NAME),
    [],
  );

  const handleDownloadAllColumns = useCallback(() => {
    exportCsvTemplate(dataSource as DataSource, "instruments-template.csv");
  }, [dataSource]);

  const handleDownloadSubset = useCallback(() => {
    exportCsvTemplate(
      dataSource as DataSource,
      "instruments-template-subset.csv",
      [],
      INSTRUMENTS_TEMPLATE_COLUMNS,
    );
  }, [dataSource]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
      <Button onClick={handleDownloadAllColumns}>
        Download template (all columns)
      </Button>
      <Button onClick={handleDownloadSubset}>
        Download template ({INSTRUMENTS_TEMPLATE_COLUMNS.join(", ")})
      </Button>
    </div>
  );
};

export const CsvExportTemplate = () => (
  <LocalDataSourceProvider>
    <CsvExportTemplateContent />
  </LocalDataSourceProvider>
);
