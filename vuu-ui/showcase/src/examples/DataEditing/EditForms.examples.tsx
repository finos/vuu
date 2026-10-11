import {
  CreateRowForm,
  type CreateRowFormField,
  EditForm,
  type EditFormValidator,
  getDataRowValues,
  useCustomEditField,
} from "@vuu-ui/vuu-data-editing";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import type { RpcResult } from "@vuu-ui/vuu-protocol-types";
import { Table } from "@vuu-ui/vuu-table";
import { TableWithEditForm } from "@vuu-ui/vuu-table-extras";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { Button, FormField, FormFieldLabel, Input } from "@salt-ds/core";
import { useData } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useState } from "react";
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

const TableWithEditFormTemplate = () => {
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
        validate={validateInstrument}
      />
    </div>
  );
};

/**
 * Pattern 5. Master–detail. Select a row to see it in the form, Edit to
 * change it, New to add a row. Selection is locked while editing.
 */
export const TableWithForm = () => (
  <LocalDataSourceProvider>
    <TableWithEditFormTemplate />
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
const TagsField = ({
  dataRow,
  name,
}: {
  dataRow: DataRow;
  name: string;
}) => {
  const originalValue = useMemo(
    () => parseTags(dataRow[name]),
    [dataRow, name],
  );
  const { error, isDirty, setValue, value = originalValue } =
    useCustomEditField<Tags>({
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
            <Button
              disabled={isEditMode}
              onClick={() => setIsEditMode(true)}
            >
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
