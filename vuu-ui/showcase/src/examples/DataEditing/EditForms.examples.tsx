import {
  CreateRowForm,
  type CreateRowFormField,
  EditField,
  EditForm,
  type EditFormValidator,
  getDataRowValues,
  useCustomEditField,
} from "@vuu-ui/vuu-data-editing";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import type { RpcResult } from "@vuu-ui/vuu-protocol-types";
import { Table } from "@vuu-ui/vuu-table";
import {
  TableEditorButtons,
  TableEditorCreateForm,
  TableEditorForm,
  TableEditorModeToggle,
  TableEditorNewButton,
  TableEditorPlaceholder,
  TableEditorPanelCloseButton,
  TableEditorTable,
  TableEditorToolbar,
  TableWithEditForm,
  type TableWithEditFormPanelVisibility,
  useTableEditor,
} from "@vuu-ui/vuu-table-extras";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import {
  Button,
  FormField,
  FormFieldLabel,
  Input,
  SidePanel,
  SidePanelContent,
  SidePanelHeader,
  SidePanelTitle,
  Tab,
  TabBar,
  TabList,
  TabPanel,
  Tabs,
  TabTrigger,
  Text,
} from "@salt-ds/core";
import { useData } from "@vuu-ui/vuu-utils";
import { type CSSProperties, useCallback, useMemo, useState } from "react";
import {
  CURRENCIES,
  INSTRUMENTS,
  instrumentColumnNames,
  instrumentsTableConfig,
} from "./instruments";

const useInstrumentsDataSource = () => {
  const { VuuDataSource } = useData();
  return useMemo(
    () =>
      new VuuDataSource({
        columns: instrumentColumnNames,
        table: INSTRUMENTS,
      }),
    [VuuDataSource],
  );
};

const instrumentFields: CreateRowFormField[] = [
  { label: "RIC", name: "ric", readOnly: true },
  { label: "Description", name: "description" },
  { label: "Currency", name: "currency" },
  { label: "Exchange", name: "exchange" },
  { label: "Lot size", name: "lotSize", serverDataType: "int" },
];

const createFields: CreateRowFormField[] = [
  { label: "RIC", name: "ric" },
  ...instrumentFields.slice(1),
  { label: "ISIN", name: "isin", required: false },
];

const validateInstrument: EditFormValidator = ({ currency, lotSize }) => {
  const errors: Record<string, string> = {};
  if (typeof currency === "string" && !CURRENCIES.includes(currency)) {
    errors.currency = `Currency must be one of ${CURRENCIES.join(", ")}`;
  }
  if (typeof lotSize === "number" && lotSize <= 0) {
    errors.lotSize = "Lot size must be greater than zero";
  }
  return errors;
};

const TableWithEditFormTemplate = ({
  panelVisibility,
}: {
  panelVisibility?: TableWithEditFormPanelVisibility;
}) => {
  const dataSource = useInstrumentsDataSource();
  return (
    <div style={{ height: 500, width: 1100 }}>
      <TableWithEditForm
        config={instrumentsTableConfig}
        createFields={createFields}
        createTitle="New instrument"
        dataSource={dataSource}
        fields={instrumentFields}
        formTitle={(row) => `Instrument ${row.ric}`}
        panelVisibility={panelVisibility}
        validate={validateInstrument}
      />
    </div>
  );
};

/**
 * Pattern 5. Master–detail. Select a row to open it in the side panel, Edit
 * to change it, New to add a row. Selection is locked, and the panel cannot
 * be closed, while editing.
 */
export const TableWithForm = () => (
  <LocalDataSourceProvider>
    <TableWithEditFormTemplate />
  </LocalDataSourceProvider>
);

/**
 * Pattern 5, with the side panel always visible. A placeholder is shown
 * when no row is selected.
 */
export const TableWithFormAlwaysVisible = () => (
  <LocalDataSourceProvider>
    <TableWithEditFormTemplate panelVisibility="always" />
  </LocalDataSourceProvider>
);

const InstrumentPanelHeader = () => {
  const { mode, selectedRow } = useTableEditor();
  return (
    <SidePanelHeader>
      <div style={{ flex: 1 }}>
        <SidePanelTitle>
          {mode === "create"
            ? "New instrument"
            : String(selectedRow?.description ?? "")}
        </SidePanelTitle>
        {mode !== "create" && selectedRow ? (
          <Text color="secondary">{selectedRow.ric}</Text>
        ) : null}
      </div>
      <TableEditorPanelCloseButton />
    </SidePanelHeader>
  );
};

/**
 * Custom form content: EditFields laid out in tabs. EditFields read the
 * row from the enclosing form, so no dataRow is needed.
 */
const InstrumentFormContent = () => {
  const { isEditing } = useTableEditor();
  return (
    <>
      <TableEditorModeToggle />
      <Tabs defaultValue="details">
        <TabBar divider>
          <TabList>
            <Tab value="details">
              <TabTrigger>Details</TabTrigger>
            </Tab>
            <Tab value="trading">
              <TabTrigger>Trading</TabTrigger>
            </Tab>
          </TabList>
        </TabBar>
        <TabPanel value="details">
          <EditField label="RIC" name="ric" readOnly />
          <EditField label="Description" name="description" />
        </TabPanel>
        <TabPanel value="trading">
          <EditField label="Currency" name="currency" />
          <EditField label="Exchange" name="exchange" />
          <EditField label="Lot size" name="lotSize" serverDataType="int" />
          {isEditing ? null : (
            <Text styleAs="label">
              Switch to Edit to change trading details
            </Text>
          )}
        </TabPanel>
      </Tabs>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <TableEditorButtons />
      </div>
    </>
  );
};

const TableWithCustomFormTemplate = () => {
  const dataSource = useInstrumentsDataSource();
  return (
    <TableWithEditForm
      dataSource={dataSource}
      style={{ height: 500, width: 1100 }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <TableEditorToolbar>
          <Text styleAs="h3" style={{ flex: 1 }}>
            Instruments
          </Text>
          <TableEditorNewButton>New instrument</TableEditorNewButton>
        </TableEditorToolbar>
        <div style={{ flex: 1, minHeight: 0 }}>
          <TableEditorTable config={instrumentsTableConfig} />
        </div>
      </div>
      <SidePanel
        position="right"
        style={{ "--saltSidePanel-width": "360px" } as CSSProperties}
      >
        <InstrumentPanelHeader />
        <SidePanelContent>
          <TableEditorPlaceholder>Select an instrument</TableEditorPlaceholder>
          <TableEditorForm showButtons={false} validate={validateInstrument}>
            <InstrumentFormContent />
          </TableEditorForm>
          <TableEditorCreateForm
            fields={createFields}
            validate={validateInstrument}
          />
        </SidePanelContent>
      </SidePanel>
    </TableWithEditForm>
  );
};

/**
 * Pattern 5, composed from the TableEditor components: a custom layout,
 * toolbar and panel header, with form content laid out in tabs and the
 * View/Edit toggle and Save/Cancel buttons placed within the form.
 */
export const TableWithCustomForm = () => (
  <LocalDataSourceProvider>
    <TableWithCustomFormTemplate />
  </LocalDataSourceProvider>
);

const rejectExchangeXXX = (dataSource: DataSource) => {
  const addRow = dataSource.addRow?.bind(dataSource);
  if (addRow) {
    dataSource.addRow = async (rowData = {}): Promise<RpcResult> => {
      if (rowData.exchange === "XXX") {
        return {
          type: "ERROR_RESULT",
          errorMessage: "Exchange XXX is not accepted by the server",
        };
      }
      return addRow(rowData);
    };
  }
  return dataSource;
};

/**
 * Wraps a dataSource so that adding an instrument on exchange "XXX" is
 * rejected, the way a server-side check would. New rows are added to the
 * session table, so it is the session dataSource's addRow that is wrapped.
 */
const withServerCheck = (dataSource: DataSource): DataSource => {
  const createSessionDataSource =
    dataSource.createSessionDataSource?.bind(dataSource);
  if (createSessionDataSource) {
    dataSource.createSessionDataSource = async (...args) => {
      const sessionDataSource = await createSessionDataSource(...args);
      return sessionDataSource
        ? rejectExchangeXXX(sessionDataSource as DataSource)
        : sessionDataSource;
    };
  }
  return dataSource;
};

const CreateRowFormTemplate = () => {
  const dataSource = useInstrumentsDataSource();
  const checkedDataSource = useMemo(
    () => withServerCheck(dataSource),
    [dataSource],
  );
  const [formKey, setFormKey] = useState(0);
  const [lastResult, setLastResult] = useState("");
  return (
    <div style={{ display: "flex", gap: 16, height: 500, width: 1100 }}>
      <div style={{ flex: "0 0 320px" }}>
        <CreateRowForm
          dataSource={checkedDataSource}
          fields={createFields}
          key={formKey}
          onCancelled={() => {
            setLastResult("Cancelled");
            setFormKey((k) => k + 1);
          }}
          onSaved={() => {
            setLastResult("Created");
            setFormKey((k) => k + 1);
          }}
          title="New instrument"
          validate={validateInstrument}
        />
        <p>{lastResult}</p>
        <p>
          Try a currency not in {CURRENCIES.join(", ")} (client validation) or
          exchange XXX (server rejection).
        </p>
      </div>
      <div style={{ flex: 1 }}>
        <Table config={instrumentsTableConfig} dataSource={dataSource} />
      </div>
    </div>
  );
};

/**
 * Pattern 6. Create row form, with client side validation and a server
 * side rejection shown on the form.
 */
export const CreateRowWithValidation = () => (
  <LocalDataSourceProvider>
    <CreateRowFormTemplate />
  </LocalDataSourceProvider>
);

type Tags = readonly string[];
const parseTags = (value: unknown): Tags =>
  typeof value === "string" && value.length > 0 ? value.split(",") : [];
const sameTags = (a: Tags, b: Tags) =>
  a.length === b.length && a.every((tag, i) => tag === b[i]);

/**
 * A custom editor for a list value stored as a comma separated string.
 * Removing then re-adding a tag reverts the edit, so the form is no longer
 * dirty.
 */
const TagsField = ({ dataRow, name }: { dataRow: DataRow; name: string }) => {
  const originalValue = useMemo(
    () => parseTags(dataRow[name]),
    [dataRow, name],
  );
  const {
    error,
    isDirty,
    setValue,
    value = originalValue,
  } = useCustomEditField<Tags>({
    equals: sameTags,
    name,
    originalValue,
    rowKey: dataRow.key,
    serialize: (tags) => tags.join(","),
  });
  const [newTag, setNewTag] = useState("");
  return (
    <FormField>
      <FormFieldLabel>
        {name} {isDirty ? "(edited)" : ""}
      </FormFieldLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {value.map((tag) => (
          <Button
            key={tag}
            onClick={() => setValue(value.filter((t) => t !== tag))}
          >
            {tag} ✕
          </Button>
        ))}
        <Input
          inputProps={{
            onKeyDown: (e) => {
              if (e.key === "Enter") {
                // Enter would otherwise submit the EditForm
                e.preventDefault();
                if (newTag && !value.includes(newTag)) {
                  setValue([...value, newTag]);
                  setNewTag("");
                }
              }
            },
          }}
          onChange={(e) => setNewTag((e.target as HTMLInputElement).value)}
          placeholder="Add, then Enter"
          value={newTag}
        />
      </div>
      {error ? <span>{error.message}</span> : null}
    </FormField>
  );
};

const CustomEditFieldTemplate = () => {
  const dataSource = useInstrumentsDataSource();
  const [dataRow, setDataRow] = useState<DataRow | undefined>();
  const [isEditMode, setIsEditMode] = useState(false);
  const handleSelect = useCallback((row: DataRow | null) => {
    // keep a plain copy, table DataRows are only valid during render
    setDataRow(
      row
        ? ({ ...getDataRowValues(row), key: row.key } as unknown as DataRow)
        : undefined,
    );
  }, []);
  return (
    <div style={{ display: "flex", gap: 16, height: 500, width: 1100 }}>
      <div style={{ flex: 1 }}>
        <Table
          config={instrumentsTableConfig}
          dataSource={dataSource}
          isRowSelectable={isEditMode ? () => false : undefined}
          onSelect={handleSelect}
          selectionModel="single"
        />
      </div>
      <div style={{ flex: "0 0 360px" }}>
        {dataRow ? (
          <>
            <Button disabled={isEditMode} onClick={() => setIsEditMode(true)}>
              Edit
            </Button>
            <EditForm
              dataRow={dataRow}
              dataSource={dataSource}
              isEditMode={isEditMode}
              key={dataRow.key}
              onCancelled={() => setIsEditMode(false)}
              onSaved={() => setIsEditMode(false)}
              title={`Tags for ${dataRow.ric}`}
            >
              {/* the bbg column stands in for a list valued column */}
              <TagsField dataRow={dataRow} name="bbg" />
            </EditForm>
          </>
        ) : (
          "Select a row"
        )}
      </div>
    </div>
  );
};

/**
 * Pattern 7. A custom (non text) editor inside an EditForm, built with
 * useCustomEditField.
 */
export const CustomEditField = () => (
  <LocalDataSourceProvider>
    <CustomEditFieldTemplate />
  </LocalDataSourceProvider>
);
