import { useState } from "react";
import { FilterClause } from "@finos/vuu-filters/src/filter-clause";
import { Filter } from "@finos/vuu-filter-types";
import { useSchemas, useTestDataSource } from "../utils";
import { Input } from "@heswell/salt-lab";
import "./NewFiltering.stories.css";

export const DefaultFilterClause = () => {
  const { schemas } = useSchemas();
  const { columns } = useTestDataSource({
    schemas,
    tablename: "instruments",
  });

  const onChange = (filter?: Filter) => console.log("Filter Change", filter);

  const onClose = () => console.log("Closing filter component");

  return (
    <div style={{ padding: "10px" }}>
      <FilterClause
        onChange={onChange}
        onClose={onClose}
        columns={columns}
        table={schemas.instruments.table}
      />
    </div>
  );
};

// TODO: Delete this before merging
export const OverridingInputWidthExample = () => {
  const [inputValue, setInputValue] = useState("hello");

  return (
    <div style={{ width: "fit-content" }}>
      <div
        className="saltInputTest"
        data-text={inputValue}
        style={{ border: "2px solid red" }}
      >
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{ padding: 0 }}
          textAlign="left"
        />
      </div>
    </div>
  );
};
