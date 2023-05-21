import { TableHeadings } from "@finos/vuu-datagrid-types";

const NO_HEADINGS: TableHeadings = [];

export const useTableModel = () => {
  return {
    headings: NO_HEADINGS,
  };
};
