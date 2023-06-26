import { DataSource, RemoteDataSource } from "@finos/vuu-data";
import { useViewportRowModel } from "@finos/vuu-data-ag-grid";
import { ColumnDescriptor, GridConfig } from "@finos/vuu-datagrid-types";
import { Filter } from "@finos/vuu-filter-types";
import { FilterInput, useFilterSuggestionProvider } from "@finos/vuu-filters";
import { View } from "@finos/vuu-layout";
import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler,
  Toolbar,
  Tooltray,
} from "@heswell/salt-lab";
import { SaltProvider } from "@salt-ds/core";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ErrorDisplay, useSchemas, useTestDataSource } from "../utils";

import "./VuuAgGrid.css";
import "./VuuGrid.css";

let displaySequence = 0;

export const AgGridTables = () => {
  const [columnConfig, tables] = useMemo(
    () => [
      {
        description: { editable: true },
        currency: {
          label: "Currency",
          type: {
            name: "string" as const,
            renderer: {
              map: {
                CAD: "Canadian $",
                EUR: "Euros",
                GBX: "Pounds",
                USD: "Dollars",
              },
            },
          },
        },
      },
      ["instruments", "orders", "parentOrders", "childOrders", "prices"],
    ],
    []
  );
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number>(-1);

  const { schemas } = useSchemas();

  // Starting point for connecting AgGrid to a Vuu server is a Vuu DataSource
  const { columns, config, dataSource, error } = useTestDataSource({
    columnConfig,
    schemas,
    tablename: tables[selectedIndex],
  });

  useEffect(() => {
    setChosenColumns(columns);
  }, [dataSource, columns]);

  const [chosenColumns, setChosenColumns] =
    useState<ColumnDescriptor[]>(columns);

  const table = useMemo(
    () => ({ module: "SIMUL", table: tables[selectedIndex] }),
    [selectedIndex, tables]
  );

  const configRef = useRef<Omit<GridConfig, "headings">>(config);
  const [tableConfig, setTableConfig] =
    useState<Omit<GridConfig, "headings">>(config);

  const { createFilterDataProvider, ...gridConfig } = useViewportRowModel({
    columns: chosenColumns,
    dataSource,
  });

  const filterSuggestionProvider = useFilterSuggestionProvider({
    columns,
    table,
  });

  useMemo(() => {
    setTableConfig((configRef.current = config));
  }, [config]);

  const handleChange: ToggleButtonGroupChangeEventHandler = (_event, index) => {
    setSelectedIndex(index);
  };

  const getCcyCol = (dataSource: DataSource) =>
    (dataSource as RemoteDataSource).table.table === "instruments"
      ? "currency"
      : "ccy";

  const groupByCurrency = useCallback(() => {
    if (selectedGroupIndex === 0) {
      dataSource.groupBy = [];
      setSelectedGroupIndex(-1);
    } else {
      dataSource.config = {
        ...dataSource.config,
        columns: columns.map((col) => col.name),
        groupBy: [getCcyCol(dataSource)],
      };
      setChosenColumns(columns);
      setSelectedGroupIndex(0);
    }
  }, [columns, dataSource, selectedGroupIndex]);
  const groupByCurrencyExchange = useCallback(() => {
    if (selectedGroupIndex === 1) {
      dataSource.groupBy = [];
      setSelectedGroupIndex(-1);
    } else {
      dataSource.config = {
        ...dataSource.config,
        columns: columns.map((col) => col.name),
        groupBy: [getCcyCol(dataSource), "exchange"],
      };
      setChosenColumns(columns);
      setSelectedGroupIndex(1);
    }
  }, [columns, dataSource, selectedGroupIndex]);
  const groupByCurrencyExchangeRic = useCallback(() => {
    if (selectedGroupIndex === 2) {
      dataSource.groupBy = [];
      setSelectedGroupIndex(-1);
    } else {
      dataSource.config = {
        ...dataSource.config,
        columns: columns.map((col) => col.name),
        groupBy: [getCcyCol(dataSource), "exchange", "ric"],
      };
      setChosenColumns(columns);
      setSelectedGroupIndex(2);
    }
  }, [columns, dataSource, selectedGroupIndex]);
  const groupByAccountAlgo = useCallback(() => {
    if (selectedGroupIndex === 3) {
      dataSource.groupBy = [];
      setSelectedGroupIndex(-1);
    } else {
      dataSource.config = {
        ...dataSource.config,
        aggregations: [
          { column: "price", aggType: 1 },
          { column: "quantity", aggType: 1 },
          { column: "filledQty", aggType: 1 },
        ],
        columns: [
          "account",
          "algo",
          "ccy",
          "averagePrice",
          "price",
          "quantity",
          "filledQty",
        ],
        groupBy: ["account", "algo"],
      };
      setChosenColumns(
        columns.filter((col) => dataSource.columns.includes(col.name))
      );
      setSelectedGroupIndex(3);
    }
  }, [columns, dataSource, selectedGroupIndex]);

  const handleSubmitFilter = useCallback(
    (filterStruct: Filter | undefined, filter: string, filterName?: string) => {
      filterName && console.log(`named filter created '${filterName}'`);
      dataSource.filter = { filter, filterStruct };
    },
    [dataSource]
  );

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }

  return (
    <SaltProvider density="high">
      <ToggleButtonGroup onChange={handleChange} selectedIndex={selectedIndex}>
        <ToggleButton tooltipText="Alert">Instruments</ToggleButton>
        <ToggleButton tooltipText="Home">Orders</ToggleButton>
        <ToggleButton tooltipText="Print">Parent Orders</ToggleButton>
        <ToggleButton tooltipText="Child Orders">Child Orders</ToggleButton>
        <ToggleButton tooltipText="Prices">Prices</ToggleButton>
      </ToggleButtonGroup>
      <Toolbar
        className="salt-density-high"
        style={
          {
            "--saltToolbar-height": "28px",
            "--saltToolbar-alignItems": "center",
          } as CSSProperties
        }
      >
        <Tooltray>
          <ToggleButtonGroup selectedIndex={selectedGroupIndex}>
            <ToggleButton onClick={groupByCurrency} tooltipText="Currency">
              Currency
            </ToggleButton>
            <ToggleButton
              onClick={groupByCurrencyExchange}
              tooltipText="Currency and Exchange"
            >
              Currency, Exchange
            </ToggleButton>
            <ToggleButton
              onClick={groupByCurrencyExchangeRic}
              tooltipText="Currency, Exchange and Ric"
            >
              CCY, Exchange, Ric
            </ToggleButton>
            {selectedIndex === 2 ? (
              <ToggleButton
                onClick={groupByAccountAlgo}
                tooltipText="Account and Algo"
              >
                Account, Algo, 7 columns
              </ToggleButton>
            ) : (
              <ToggleButton>Ignore</ToggleButton>
            )}
          </ToggleButtonGroup>
        </Tooltray>
        <Tooltray>
          <FilterInput
            existingFilter={dataSource.filter.filterStruct}
            onSubmitFilter={handleSubmitFilter}
            style={{ width: 300 }}
            suggestionProvider={filterSuggestionProvider}
          />
        </Tooltray>
      </Toolbar>

      <View style={{ width: 800, height: 500 }} className="ag-theme-balham">
        <AgGridReact
          {...gridConfig}
          headerHeight={24}
          rowGroupPanelShow="always"
          rowHeight={18}
        />
      </View>
    </SaltProvider>
  );
};
AgGridTables.displaySequence = displaySequence++;
