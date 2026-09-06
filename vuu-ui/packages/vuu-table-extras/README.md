# @vuu-ui/vuu-table-extras

Extended components and utilities for Vuu tables, including CSV export, CSV upload and validation, column settings, column pickers, custom cell renderers, and table footer controls.

---

## Features

### [CSV Export](./src/csv-export/README.md)
Standalone utilities and a React hook for exporting table data and template schemas to CSV:
- `exportToCsv(dataSource, options)`: Subscribes to a session table, collects rows in memory in index order, formats values, and triggers browser downloads.
- `exportCsvTemplate(dataSource, options)`: Generates a header-only CSV template for import workflows.
- `useCsvExport(dataSource)`: React hook with built-in `isExporting` state, error handling, and helper methods.

### [CSV Upload](./src/csv-upload/README.md)
Dialog and hook workflow for importing CSV data into Vuu tables via server-side session tables:
- `CsvUpload`: Complete dialog component with file drag-and-drop, client-side validation, error summaries, and staging controls.
- `useCsvUpload`: Headless hook managing file parsing, schema validation, session table staging, and RPC row batching.
- `DataUploadPreview`: Inline editable table preview for inspecting and correcting invalid staged rows before commit.

### Column Management
- `ColumnMenu` & `useColumnActions`: Context menus for sorting, grouping, filtering, and column configuration.
- `ColumnPicker` & `useTableColumnPicker`: Dialog and drawer controls for selecting and reordering visible columns.
- `CalculatedColumnPanel`: UI panel for defining custom expression-based columns.

### Cell Renderers & Formatters
- Pre-built cell renderers including `BackgroundCell`, `DropdownCell`, `IconButtonCell`, and undo support.
- Cell edit validators for ensuring valid data entry.

### Table Footer & Status Controls
- `TableFooter` & `TableFooterTray`: Status bar and pagination trays.
- `DataSourceStats`: Live indicators for row count, connection state, freeze status, and filter metrics.
