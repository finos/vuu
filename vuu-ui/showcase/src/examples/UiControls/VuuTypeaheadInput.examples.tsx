import { Input } from "@salt-ds/core";
import { getSchema, type VuuTableName } from "@vuu-ui/vuu-data-test";
import { DataSource } from "@vuu-ui/vuu-data-types";
import {
  VuuTypeaheadInput,
  type VuuTypeaheadInputProps,
} from "@vuu-ui/vuu-ui-controls";
import {
  CommitHandler,
  DataSourceProvider,
  Range,
  toColumnName,
  useData,
} from "@vuu-ui/vuu-utils";
import { CSSProperties, ReactNode, useMemo } from "react";

const SurroundedByInputs = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      alignItems: "center",
      border: "solid 1px black",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: 12,
      width: 300,
    }}
  >
    <Input />
    {children}
    <Input />
  </div>
);

const TypeaheadInputTemplate = ({
  allowFreeInput,
  column = "currency",
  dataSource: dataSourceProp,
  minCharacterCountToTriggerSuggestions = 1,
  onCommit,
  tableName = "instrumentsExtended",
  withoutTypeahead = false,
}: Partial<VuuTypeaheadInputProps> & {
  dataSource?: DataSource;
  tableName?: VuuTableName;
  style?: CSSProperties;
  withoutTypeahead?: boolean;
}) => {
  const table = { module: "SIMUL", table: tableName };
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    const schema = getSchema(tableName);
    return (
      dataSourceProp ??
      new VuuDataSource({
        columns: schema.columns.map(toColumnName),
        table: schema.table,
      })
    );
  }, [VuuDataSource, dataSourceProp, tableName]);

  const handleCommit: CommitHandler = (evt, value) => {
    onCommit?.(evt, value);
    console.log(`commit ${value}`);
  };

  if (withoutTypeahead) {
    return (
      <VuuTypeaheadInput
        allowFreeInput={allowFreeInput}
        column={column}
        minCharacterCountToTriggerSuggestions={
          minCharacterCountToTriggerSuggestions
        }
        onCommit={handleCommit}
        table={table}
      />
    );
  } else {
    return (
      <DataSourceProvider dataSource={dataSource}>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            padding: "0 3px",
            width: 200,
            height: 32,
            border: "solid 1px lightgray",
          }}
        >
          <VuuTypeaheadInput
            allowFreeInput={allowFreeInput}
            column={column}
            minCharacterCountToTriggerSuggestions={
              minCharacterCountToTriggerSuggestions
            }
            onCommit={handleCommit}
            table={table}
          />
        </div>
      </DataSourceProvider>
    );
  }
};

/** tags=data-consumer */
export const CurrencyWithTypeaheadAllowFreeText = ({
  onCommit,
}: {
  onCommit?: CommitHandler;
}) => {
  return <TypeaheadInputTemplate onCommit={onCommit} />;
};

/** tags=data-consumer */
export const ShowsSuggestionsNoTextRequired = ({
  onCommit,
}: {
  onCommit?: CommitHandler;
}) => {
  return (
    <TypeaheadInputTemplate
      minCharacterCountToTriggerSuggestions={0}
      onCommit={onCommit}
    />
  );
};

/** tags=data-consumer */
export const WithOpenOnFocus = ({ onCommit }: { onCommit?: CommitHandler }) => {
  return (
    <SurroundedByInputs>
      <TypeaheadInputTemplate
        minCharacterCountToTriggerSuggestions={0}
        onCommit={onCommit}
      />
    </SurroundedByInputs>
  );
};

/** tags=data-consumer */
export const CurrencyWithTypeaheadDisallowFreeText = ({
  onCommit,
}: {
  onCommit?: CommitHandler;
}) => {
  return <TypeaheadInputTemplate allowFreeInput={false} onCommit={onCommit} />;
};

/** tags=data-consumer */
export const RicWithTypeaheadDisallowFreeText = ({
  onCommit,
}: {
  onCommit?: CommitHandler;
}) => {
  return (
    <TypeaheadInputTemplate
      allowFreeInput={false}
      column="ric"
      onCommit={onCommit}
    />
  );
};

export const CurrencyNoTypeaheadAllowFreeText = () => {
  return <TypeaheadInputTemplate withoutTypeahead />;
};

export const CurrencyNoTypeaheadDisallowFreeText = () => {
  return <TypeaheadInputTemplate allowFreeInput={false} withoutTypeahead />;
};

export const SingleColumnDataSource = () => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    const schema = getSchema("instruments");
    const ds = new VuuDataSource({
      columns: ["ric"],
      table: schema.table,
    });
    ds.subscribe(
      {
        range: Range(0, 0),
      },
      (msg) => console.log({ msg }),
    );
    return ds;
  }, [VuuDataSource]);

  return (
    <TypeaheadInputTemplate
      allowFreeInput={false}
      column="ric"
      dataSource={dataSource}
      tableName="instruments"
    />
  );
};
