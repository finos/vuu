import { getSchema } from "@vuu-ui/vuu-data-test";
import {
  VuuInput,
  VuuTypeaheadInput,
  VuuTypeaheadInputProps,
} from "@vuu-ui/vuu-ui-controls";
import { DataSourceProvider, toColumnName, useData } from "@vuu-ui/vuu-utils";
import { FormEventHandler, useCallback, useMemo, useState } from "react";

const containerStyle = {
  padding: 24,
  width: 200,
};

export const DefaultVuuInputControlled = () => {
  const [value, setValue] = useState("AAOP.N");
  const handleChange = useCallback<FormEventHandler<HTMLInputElement>>((e) => {
    const input = e.target as HTMLInputElement;
    setValue(input.value);
  }, []);

  const handleCommit = useCallback(() => {
    console.log("commit");
  }, []);

  return (
    <div style={containerStyle}>
      <VuuInput onChange={handleChange} onCommit={handleCommit} value={value} />
    </div>
  );
};

export const DefaultVuuTypeaheadInput = () => {
  const [value, setValue] = useState("AAOP.N");
  const handleChange = useCallback<FormEventHandler<HTMLInputElement>>((e) => {
    const input = e.target as HTMLInputElement;
    setValue(input.value);
  }, []);

  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    const schema = getSchema("instruments");
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource]);

  const handleCommit = useCallback(() => {
    console.log("commit");
  }, []);

  const inputProps = useMemo<VuuTypeaheadInputProps["inputProps"]>(
    () => ({
      onChange: handleChange,
      value,
    }),
    [handleChange, value],
  );

  return (
    <div style={containerStyle}>
      <style>{`.vuuTypeaheadInput { border: solid 1px black; }`}</style>
      <DataSourceProvider dataSource={dataSource}>
        <VuuTypeaheadInput
          column="ric"
          inputProps={inputProps}
          onCommit={handleCommit}
          table={{ module: "SIMUL", table: "instruments" }}
        />
      </DataSourceProvider>
    </div>
  );
};
