import {
  FilterEditCancelHandler,
  FilterEditor,
  FilterEditorProps,
  FilterEditSaveHandler,
} from "@finos/vuu-filters";
import { useCallback, useMemo } from "react";
import { getSchema, vuuModule } from "@finos/vuu-data-test";
import { Filter } from "@finos/vuu-filter-types";

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
        onCancel={onCancel}
        onSave={onSave}
        style={style}
        tableSchema={tableSchema}
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

  const filter = useMemo<Filter>(() => {
    return {
      column: "currency",
      op: "=",
      value: "EUR",
    };
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
        filter={filter}
        onCancel={onCancel}
        onSave={onSave}
        style={style}
        tableSchema={tableSchema}
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

  const filter = useMemo<Filter>(() => {
    return {
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
    };
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
        filter={filter}
        onCancel={onCancel}
        onSave={onSave}
        style={style}
        tableSchema={tableSchema}
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

  const filter = useMemo<Filter>(() => {
    return {
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
    };
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
        filter={filter}
        onCancel={onCancel}
        onSave={onSave}
        style={style}
        tableSchema={tableSchema}
      />
    </>
  );
};
EditMultiClauseOrFilter.displaySequence = displaySequence++;
