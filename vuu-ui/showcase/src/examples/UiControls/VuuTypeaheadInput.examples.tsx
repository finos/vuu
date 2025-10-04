import { getSchema, type VuuTableName } from "@vuu-ui/vuu-data-test";
import {
  VuuTypeaheadInput,
  type VuuTypeaheadInputProps,
} from "@vuu-ui/vuu-ui-controls";
import {
  CommitHandler,
  DataSourceProvider,
  toColumnName,
  useData,
} from "@vuu-ui/vuu-utils";
import { CSSProperties, useMemo } from "react";

const TypeaheadInputTemplate = ({
  allowFreeInput,
  column = "currency",
  minCharacterCountToTriggerSuggestions = 1,
  onCommit,
  tableName = "instrumentsExtended",
  withoutTypeahead = false,
}: Partial<VuuTypeaheadInputProps> & {
  tableName?: VuuTableName;
  style?: CSSProperties;
  withoutTypeahead?: boolean;
}) => {
  const table = { module: "SIMUL", table: tableName };
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    const schema = getSchema(tableName);
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource, tableName]);

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
