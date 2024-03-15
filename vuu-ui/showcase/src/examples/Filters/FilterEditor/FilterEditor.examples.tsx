import {
  FilterEditCancelHandler,
  FilterEditor,
  FilterEditorProps,
  FilterEditSaveHandler,
} from "@finos/vuu-filters";
import { FilterModel } from "@finos/vuu-filters";
import { CSSProperties, useCallback, useMemo, useState } from "react";
import { getSchema, vuuModule } from "@finos/vuu-data-test";

let displaySequence = 1;

const lastUpdatedColumn = {
  name: "lastUpdated",
  serverDataType: "long",
  type: "date/time",
} as const;

export const NewFilter = ({
  onSave: onSaveProp,
  ...props
}: Partial<FilterEditorProps>) => {
  const tableSchema = useMemo(() => getSchema("instruments"), []);

  const { typeaheadHook } = vuuModule("SIMUL");

  const style = useMemo(
    () => ({
      background: "#eee",
    }),
    []
  );

  const [isValid, setIsValid] = useState(false);

  const filterModel = useMemo(() => {
    const filterModel = new FilterModel();
    filterModel.on("isValid", setIsValid);
    return filterModel;
  }, []);

  const onCancel = useCallback<FilterEditCancelHandler>(() => {
    console.log(`cancel  filter edit`);
  }, []);

  const onSave = useMemo<FilterEditSaveHandler>(
    () =>
      onSaveProp ??
      ((filter) => {
        console.log(`save filter ${JSON.stringify(filter)}`);
      }),
    [onSaveProp]
  );

  return (
    <>
      <FilterEditor
        {...props}
        FilterClauseEditorProps={{
          suggestionProvider: typeaheadHook,
        }}
        columnDescriptors={tableSchema.columns}
        filterModel={filterModel}
        onCancel={onCancel}
        onSave={onSave}
        style={style}
        tableSchema={tableSchema}
      />

      <span
        data-icon={isValid ? "tick" : "cross"}
        style={{ "--vuu-icon-size": "20px" } as CSSProperties}
      />
    </>
  );
};
NewFilter.displaySequence = displaySequence++;

export const EditSimplerFilter = ({
  onSave: onSaveProp,
  ...props
}: Partial<FilterEditorProps>) => {
  const tableSchema = useMemo(() => getSchema("instruments"), []);

  const { typeaheadHook } = vuuModule("SIMUL");

  const style = useMemo(
    () => ({
      background: "#eee",
    }),
    []
  );

  const [isValid, setIsValid] = useState(false);

  const filterModel = useMemo(() => {
    const filterModel = new FilterModel({
      column: "currency",
      op: "=",
      value: "EUR",
    });
    filterModel.on("isValid", setIsValid);
    return filterModel;
  }, []);

  const onCancel = useCallback<FilterEditCancelHandler>(() => {
    console.log(`cancel  filter edit`);
  }, []);

  const onSave = useMemo<FilterEditSaveHandler>(
    () =>
      onSaveProp ??
      ((filter) => {
        console.log(`save filter ${JSON.stringify(filter)}`);
      }),
    [onSaveProp]
  );

  return (
    <>
      <FilterEditor
        {...props}
        FilterClauseEditorProps={{
          suggestionProvider: typeaheadHook,
        }}
        columnDescriptors={tableSchema.columns.concat(lastUpdatedColumn)}
        filterModel={filterModel}
        onCancel={onCancel}
        onSave={onSave}
        style={style}
        tableSchema={tableSchema}
      />
      <span
        data-icon={isValid ? "tick" : "cross"}
        style={{ "--vuu-icon-size": "20px" } as CSSProperties}
      />
    </>
  );
};
EditSimplerFilter.displaySequence = displaySequence++;

export const EditMultiClauseAndFilter = ({
  onSave: onSaveProp,
  ...props
}: Partial<FilterEditorProps>) => {
  const tableSchema = useMemo(() => getSchema("instruments"), []);

  const { typeaheadHook } = vuuModule("SIMUL");

  const style = useMemo(
    () => ({
      background: "#eee",
    }),
    []
  );

  const [isValid, setIsValid] = useState(false);

  const filterModel = useMemo(() => {
    const filterModel = new FilterModel({
      op: "and",
      filters: [
        {
          column: "currency",
          op: "=",
          value: "EUR",
        },
        {
          column: "exchange",
          op: "=",
          value: "XLON",
        },
      ],
    });
    filterModel.on("isValid", setIsValid);
    return filterModel;
  }, []);

  const onCancel = useCallback<FilterEditCancelHandler>(() => {
    console.log(`cancel  filter edit`);
  }, []);

  const onSave = useMemo<FilterEditSaveHandler>(
    () =>
      onSaveProp ??
      ((filter) => {
        console.log(`save filter ${JSON.stringify(filter)}`);
      }),
    [onSaveProp]
  );

  return (
    <>
      <FilterEditor
        {...props}
        FilterClauseEditorProps={{
          suggestionProvider: typeaheadHook,
        }}
        columnDescriptors={tableSchema.columns}
        filterModel={filterModel}
        onCancel={onCancel}
        onSave={onSave}
        style={style}
        tableSchema={tableSchema}
      />
      <span
        data-icon={isValid ? "tick" : "cross"}
        style={{ "--vuu-icon-size": "20px" } as CSSProperties}
      />
    </>
  );
};
EditMultiClauseAndFilter.displaySequence = displaySequence++;

export const EditMultiClauseOrFilter = ({
  onSave: onSaveProp,
  ...props
}: Partial<FilterEditorProps>) => {
  const tableSchema = useMemo(() => getSchema("instruments"), []);

  const { typeaheadHook } = vuuModule("SIMUL");

  const style = useMemo(
    () => ({
      background: "#eee",
    }),
    []
  );

  const [isValid, setIsValid] = useState(false);

  const filterModel = useMemo(() => {
    const filterModel = new FilterModel({
      op: "or",
      filters: [
        {
          column: "currency",
          op: "=",
          value: "EUR",
        },
        {
          column: "exchange",
          op: "=",
          value: "XLON/LSE-SETS",
        },
      ],
    });
    filterModel.on("isValid", setIsValid);
    return filterModel;
  }, []);

  const onCancel = useCallback<FilterEditCancelHandler>(() => {
    console.log(`cancel  filter edit`);
  }, []);

  const onSave = useMemo<FilterEditSaveHandler>(
    () =>
      onSaveProp ??
      ((filter) => {
        console.log(`save filter ${JSON.stringify(filter)}`);
      }),
    [onSaveProp]
  );

  return (
    <>
      <FilterEditor
        {...props}
        FilterClauseEditorProps={{
          suggestionProvider: typeaheadHook,
        }}
        columnDescriptors={tableSchema.columns}
        filterModel={filterModel}
        onCancel={onCancel}
        onSave={onSave}
        style={style}
        tableSchema={tableSchema}
      />
      <span
        data-icon={isValid ? "tick" : "cross"}
        style={{ "--vuu-icon-size": "20px" } as CSSProperties}
      />
    </>
  );
};
EditMultiClauseOrFilter.displaySequence = displaySequence++;
