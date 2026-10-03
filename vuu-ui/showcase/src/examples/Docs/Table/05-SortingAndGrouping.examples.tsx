import {
  Button,
  ToggleButton,
  ToggleButtonGroup,
  type ToggleButtonGroupProps,
} from "@salt-ds/core";
import type { DataSourceConfig } from "@vuu-ui/vuu-data-types";
import { Table } from "@vuu-ui/vuu-table";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { useEffect, useMemo, useState } from "react";
import { stockColumns, useStockDataSource } from "./sample-data";

const columns = stockColumns.slice(0, 8);

export const HeaderSorting = () => {
  const [sort, setSort] = useState("none");
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  useEffect(() => {
    const handleConfigChange = (config: DataSourceConfig) =>
      setSort(JSON.stringify(config.sort?.sortDefs ?? []));
    dataSource.on("config", handleConfigChange);
    return () => {
      dataSource.removeListener("config", handleConfigChange);
    };
  }, [dataSource]);

  return (
    <>
      <Table config={config} dataSource={dataSource} height={300} width={800} />
      <code>sortDefs: {sort}</code>
    </>
  );
};

export const ProgrammaticSort = () => {
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource({
    sort: { sortDefs: [{ column: "volume", sortType: "D" }] },
  });

  return (
    <>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          onClick={() => {
            dataSource.sort = {
              sortDefs: [{ column: "volume", sortType: "D" }],
            };
          }}
        >
          Most active
        </Button>
        <Button
          onClick={() => {
            dataSource.sort = {
              sortDefs: [
                { column: "sector", sortType: "A" },
                { column: "change", sortType: "D" },
              ],
            };
          }}
        >
          Best by sector
        </Button>
        <Button
          onClick={() => {
            dataSource.sort = { sortDefs: [] };
          }}
        >
          Clear sort
        </Button>
      </div>
      <Table config={config} dataSource={dataSource} height={300} width={800} />
    </>
  );
};

export const Filtering = () => {
  const [filter, setFilter] = useState("");
  const config = useMemo<TableConfig>(
    () => ({ columns, rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource();

  const handleChange: ToggleButtonGroupProps["onChange"] = (e) => {
    const { value } = e.currentTarget;
    setFilter(value);
    dataSource.filter = { filter: value };
  };

  return (
    <>
      <ToggleButtonGroup onChange={handleChange} value={filter}>
        <ToggleButton value="">All</ToggleButton>
        <ToggleButton value='currency = "USD"'>USD</ToggleButton>
        <ToggleButton value='sector in ["Energy","Materials"]'>
          Energy &amp; Materials
        </ToggleButton>
        <ToggleButton value="change > 0 and esg = true">
          ESG risers
        </ToggleButton>
      </ToggleButtonGroup>
      <Table config={config} dataSource={dataSource} height={300} width={800} />
    </>
  );
};

export const Grouping = () => {
  const [groupBy, setGroupBy] = useState("sector");
  const config = useMemo<TableConfig>(
    () => ({ columns: stockColumns.slice(0, 8), rowSeparators: true }),
    [],
  );
  const dataSource = useStockDataSource({ groupBy: ["sector"] });

  const handleChange: ToggleButtonGroupProps["onChange"] = (e) => {
    const { value } = e.currentTarget;
    setGroupBy(value);
    dataSource.groupBy = value === "" ? [] : value.split(",");
  };

  return (
    <>
      <ToggleButtonGroup onChange={handleChange} value={groupBy}>
        <ToggleButton value="">None</ToggleButton>
        <ToggleButton value="sector">Sector</ToggleButton>
        <ToggleButton value="exchange">Exchange</ToggleButton>
        <ToggleButton value="currency,sector">Currency, sector</ToggleButton>
      </ToggleButtonGroup>
      <Table config={config} dataSource={dataSource} height={360} width={860} />
    </>
  );
};

export const Aggregation = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: stockColumns.slice(0, 8).map((column) =>
        column.name === "volume"
          ? { ...column, type: { name: "number", formatting: { decimals: 0 } } }
          : column,
      ),
      rowSeparators: true,
    }),
    [],
  );
  const dataSource = useStockDataSource({ groupBy: ["sector"] });

  useEffect(() => {
    dataSource.aggregations = [{ column: "volume", aggType: 1 }];
  }, [dataSource]);

  return (
    <Table
      config={config}
      dataSource={dataSource}
      groupToggleTarget="toggle-icon"
      height={300}
      width={860}
    />
  );
};
