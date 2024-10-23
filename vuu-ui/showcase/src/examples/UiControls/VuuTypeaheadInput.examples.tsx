import { LocalDataSourceProvider } from "@finos/vuu-data-test";
import { TableSchemaTable } from "@finos/vuu-data-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { VuuTypeaheadInput } from "@finos/vuu-ui-controls";
import { CommitHandler } from "@finos/vuu-utils";
import { CSSProperties } from "react";

let displaySequence = 1;

const TypeaheadInputTemplate = ({
  allowFreeInput,
  column = { name: "currency", serverDataType: "string" },
  onCommit,
  table = { module: "SIMUL", table: "instrumentsExtended" },
}: {
  allowFreeInput?: boolean;
  column?: ColumnDescriptor;
  onCommit?: CommitHandler;
  style?: CSSProperties;
  table?: TableSchemaTable;
}) => {
  const handleCommit: CommitHandler = (evt, value) => {
    console.log(`commit ${value}`);
    onCommit?.(evt, value);
  };

  return (
    <VuuTypeaheadInput
      allowFreeInput={allowFreeInput}
      column={column.name}
      onCommit={handleCommit}
      table={table}
    />
  );
};

export const CurrencyWithTypeaheadAllowFreeText = ({
  onCommit,
}: {
  onCommit?: CommitHandler;
}) => {
  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
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
        <TypeaheadInputTemplate onCommit={onCommit} />
      </div>
    </LocalDataSourceProvider>
  );
};
CurrencyWithTypeaheadAllowFreeText.displaySequence = displaySequence++;

export const CurrencyWithTypeaheadDisallowFreeText = ({
  onCommit,
}: {
  onCommit?: CommitHandler;
}) => {
  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
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
        <TypeaheadInputTemplate allowFreeInput={false} onCommit={onCommit} />
      </div>
    </LocalDataSourceProvider>
  );
};
CurrencyWithTypeaheadDisallowFreeText.displaySequence = displaySequence++;

export const CurrencyNoTypeaheadAllowFreeText = () => {
  return (
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
      <TypeaheadInputTemplate />
    </div>
  );
};
CurrencyNoTypeaheadAllowFreeText.displaySequence = displaySequence++;

export const CurrencyNoTypeaheadDisallowFreeText = () => {
  return (
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
      <TypeaheadInputTemplate allowFreeInput={false} />
    </div>
  );
};
CurrencyNoTypeaheadDisallowFreeText.displaySequence = displaySequence++;
