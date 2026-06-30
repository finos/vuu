import type { DataSource } from "@vuu-ui/vuu-data-types";
import { useData } from "@vuu-ui/vuu-utils";
import type { ColumnDescriptor, TableConfig } from "@vuu-ui/vuu-table-types";
import { useEffect, useState } from "react";
import type { CsvUploadSessionTable } from "./CsvUpload";

export type UseCsvUploadSessionPreviewReturn = {
  isLoadingPreview: boolean;
  previewConfig: TableConfig | undefined;
  previewDataSource: DataSource | undefined;
  previewError: string | undefined;
};

export const useCsvUploadSessionPreview = (
  sessionTable: CsvUploadSessionTable | undefined,
): UseCsvUploadSessionPreviewReturn => {
  const { VuuDataSource, getServerAPI } = useData();
  const [previewConfig, setPreviewConfig] = useState<TableConfig | undefined>();
  const [previewDataSource, setPreviewDataSource] = useState<
    DataSource | undefined
  >();
  const [previewError, setPreviewError] = useState<string | undefined>();
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!sessionTable) {
      setPreviewDataSource(undefined);
      setPreviewConfig(undefined);
      setPreviewError(undefined);
      setIsLoadingPreview(false);
      return;
    }

    const loadSessionTablePreview = async () => {
      setIsLoadingPreview(true);
      setPreviewError(undefined);

      try {
        const server = await getServerAPI();
        const schema = await server.getTableSchema(sessionTable);

        if (cancelled) {
          return;
        }

        const columnDescriptors: ColumnDescriptor[] = schema.columns.map(
          ({ name, serverDataType }) =>
            name === "vuuMsg"
              ? { name, serverDataType, width: 300, label: "Error" }
              : { name, serverDataType },
        );

        setPreviewConfig({
          columns: columnDescriptors,
          zebraStripes: true,
          rowSeparators: true,
          columnSeparators: true,
        });
        setPreviewDataSource(
          new VuuDataSource({
            columns: columnDescriptors.map(({ name }) => name),
            table: sessionTable,
          }),
        );
      } catch (error) {
        if (!cancelled) {
          setPreviewDataSource(undefined);
          setPreviewConfig(undefined);
          setPreviewError(
            `Failed to load session table preview: ${String(error)}`,
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPreview(false);
        }
      }
    };

    loadSessionTablePreview();

    return () => {
      cancelled = true;
    };
  }, [VuuDataSource, getServerAPI, sessionTable]);

  return {
    isLoadingPreview,
    previewConfig,
    previewDataSource,
    previewError,
  };
};
