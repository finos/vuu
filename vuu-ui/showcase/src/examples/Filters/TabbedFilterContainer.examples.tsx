import { getSchema, VuuTableName } from "@vuu-ui/vuu-data-test";
import { DataSourceFilter, TableSchemaTable } from "@vuu-ui/vuu-data-types";
import {
  ColumnFilterProps,
  FilterContainerColumnFilter,
  FilterProvider,
  TabbedFilterContainer,
  TabbedFilterContainerProps,
  useSavedFilters,
} from "@vuu-ui/vuu-filters";
import { Table } from "@vuu-ui/vuu-table";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  ContextPanelProvider,
  IconButton,
  useContextPanel,
} from "@vuu-ui/vuu-ui-controls";
import {
  DataSourceProvider,
  filterAsQuery,
  toColumnName,
  useData,
} from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";
import { DemoTableContainer } from "../Table/DemoTableContainer";
import { FormField, FormFieldLabel } from "@salt-ds/core";

const schema = getSchema("instruments");

const typeaheadPropsZero: ColumnFilterProps["TypeaheadProps"] = {
  minCharacterCountToTriggerSuggestions: 0,
  selectOnTab: false,
};
const typeaheadPropsOne: ColumnFilterProps["TypeaheadProps"] = {
  minCharacterCountToTriggerSuggestions: 1,
  selectOnTab: false,
};

export const MultipleTabbedFilterContainers = () => {
  const { VuuDataSource } = useData();

  const [
    SavedFilterPanelProps,
    [vuuCreatedTimestamp, bbg, currency, exchange, lotSize],
  ] = useMemo<
    [
      TabbedFilterContainerProps["SavedFilterPanelProps"],
      Array<ColumnDescriptor>,
    ]
  >(() => {
    const columns: ColumnDescriptor[] = [
      {
        label: "Vuu Created TS",
        name: "vuuCreatedTimestamp",
        serverDataType: "long",
        type: "time",
      },
      { name: "bbg", serverDataType: "string" },
      { name: "currency", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "lotSize", serverDataType: "int" },
    ];
    return [
      {
        availableColumns: columns,
        filterPillPermissions: {
          allowClose: false,
          allowEdit: false,
        },
      },
      columns,
    ];
  }, []);

  const table = useMemo<TableSchemaTable>(
    () => ({ module: "SIMUL", table: "instruments" }),
    [],
  );

  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: schema.columns.map(toColumnName),
        table: schema.table,
      }),
    [VuuDataSource],
  );

  return (
    <FilterProvider>
      <DataSourceProvider dataSource={dataSource}>
        <style>{`
        .vuuTabbedFilterContainer {
        width: 300px;
        }
        `}</style>
        <div
          style={{
            display: "flex",
            height: "100vh",
            padding: 20,
            width: "100vw",
          }}
        >
          <TabbedFilterContainer
            data-testid="tc-1"
            filterProviderKey="test1"
            SavedFilterPanelProps={SavedFilterPanelProps}
          >
            <FormField>
              <FormFieldLabel>Vuu Created</FormFieldLabel>
              <FilterContainerColumnFilter
                TypeaheadProps={typeaheadPropsOne}
                column={vuuCreatedTimestamp}
                operator="between"
                table={table}
              />
            </FormField>
            <FormField>
              <FormFieldLabel>BBG</FormFieldLabel>
              <FilterContainerColumnFilter
                TypeaheadProps={typeaheadPropsOne}
                column={bbg}
                table={table}
              />
            </FormField>
            <FormField>
              <FormFieldLabel>Currency</FormFieldLabel>
              <FilterContainerColumnFilter
                data-testid="ccy-1"
                TypeaheadProps={typeaheadPropsZero}
                column={currency}
                table={table}
              />
            </FormField>
            <FormField>
              <FormFieldLabel>Exchange</FormFieldLabel>
              <FilterContainerColumnFilter
                data-testid="exchange-1"
                TypeaheadProps={typeaheadPropsZero}
                column={exchange}
                table={table}
              />
            </FormField>
            <FormField>
              <FormFieldLabel>Lot Size</FormFieldLabel>
              <FilterContainerColumnFilter
                column={lotSize}
                operator="between"
              />
            </FormField>
          </TabbedFilterContainer>
          <TabbedFilterContainer
            filterProviderKey="test2"
            SavedFilterPanelProps={SavedFilterPanelProps}
          >
            <FormField>
              <FormFieldLabel>Vuu Created</FormFieldLabel>
              <FilterContainerColumnFilter
                TypeaheadProps={typeaheadPropsOne}
                column={vuuCreatedTimestamp}
                operator="between"
                table={table}
              />
            </FormField>
            <FormField>
              <FormFieldLabel>BBG</FormFieldLabel>
              <FilterContainerColumnFilter
                TypeaheadProps={typeaheadPropsOne}
                column={bbg}
                table={table}
              />
            </FormField>
            <FormField>
              <FormFieldLabel>Currency</FormFieldLabel>
              <FilterContainerColumnFilter
                TypeaheadProps={typeaheadPropsZero}
                column={currency}
                table={table}
              />
            </FormField>
            <FormField>
              <FormFieldLabel>Exchange</FormFieldLabel>
              <FilterContainerColumnFilter
                TypeaheadProps={typeaheadPropsZero}
                column={exchange}
                table={table}
              />
            </FormField>
            <FormField>
              <FormFieldLabel>Lot Size</FormFieldLabel>
              <FilterContainerColumnFilter
                column={lotSize}
                operator="between"
              />
            </FormField>
          </TabbedFilterContainer>
        </div>
      </DataSourceProvider>
    </FilterProvider>
  );
};

const TableWithTabbedFilterContainerTemplate = ({
  SavedFilterPanelProps,
  children,
  table = "instruments",
}: Pick<TabbedFilterContainerProps, "children" | "SavedFilterPanelProps"> & {
  table?: VuuTableName;
}) => {
  const showContextPanel = useContextPanel();
  const { VuuDataSource } = useData();

  const { currentFilter } = useSavedFilters();

  const schema = useMemo(() => getSchema(table), [table]);

  const dataSource = useMemo(() => {
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource, schema]);

  useMemo(() => {
    if (currentFilter && currentFilter.filter !== null) {
      const vuuFilter: DataSourceFilter = {
        filter: filterAsQuery(currentFilter?.filter),
        filterStruct: currentFilter?.filter,
      };
      dataSource.filter = vuuFilter;
    } else {
      dataSource.filter = { filter: "" };
    }
  }, [currentFilter, dataSource]);

  const config = useMemo(
    () => ({
      columns: schema.columns,
    }),
    [schema],
  );

  const showFilters = useCallback(() => {
    const columnFilterContainer = (
      <DataSourceProvider dataSource={dataSource}>
        <TabbedFilterContainer SavedFilterPanelProps={SavedFilterPanelProps}>
          {children}
        </TabbedFilterContainer>
      </DataSourceProvider>
    );

    showContextPanel(columnFilterContainer, "filters");
  }, [SavedFilterPanelProps, children, dataSource, showContextPanel]);

  return (
    <>
      <div style={{ height: 32, display: "flex", justifyContent: "flex-end" }}>
        <IconButton
          appearance="transparent"
          data-embedded
          icon="filter"
          onClick={showFilters}
          sentiment="neutral"
        />
      </div>
      <Table config={config} dataSource={dataSource} />
    </>
  );
};

export const InstrumentsWithTabbedFilterContainerAndFilterProvider = () => {
  const table = useMemo<TableSchemaTable>(
    () => ({ module: "SIMUL", table: "instruments" }),
    [],
  );

  const [
    SavedFilterPanelProps,
    [vuuCreatedTimestamp, bbg, currency, exchange, lotSize],
  ] = useMemo<
    [
      TabbedFilterContainerProps["SavedFilterPanelProps"],
      Array<ColumnDescriptor>,
    ]
  >(() => {
    const columns: ColumnDescriptor[] = [
      {
        label: "Vuu Created TS",
        name: "vuuCreatedTimestamp",
        serverDataType: "long",
        type: "time",
      },
      { name: "bbg", serverDataType: "string" },
      { name: "currency", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "lotSize", serverDataType: "int" },
    ];
    return [{ availableColumns: columns }, columns];
  }, []);

  return (
    <>
      <style>{`
        .vuuFilterContainer {
            height: 100%;
        }
    `}</style>
      <FilterProvider>
        <DemoTableContainer>
          <ContextPanelProvider>
            <TableWithTabbedFilterContainerTemplate
              SavedFilterPanelProps={SavedFilterPanelProps}
            >
              <FormField>
                <FormFieldLabel>Vuu Created</FormFieldLabel>
                <FilterContainerColumnFilter
                  TypeaheadProps={typeaheadPropsOne}
                  column={vuuCreatedTimestamp}
                  operator="between"
                  table={table}
                />
              </FormField>
              <FormField>
                <FormFieldLabel>BBG</FormFieldLabel>
                <FilterContainerColumnFilter
                  TypeaheadProps={typeaheadPropsOne}
                  column={bbg}
                  table={table}
                />
              </FormField>
              <FormField>
                <FormFieldLabel>Currency</FormFieldLabel>
                <FilterContainerColumnFilter
                  TypeaheadProps={typeaheadPropsZero}
                  column={currency}
                  table={table}
                />
              </FormField>
              <FormField>
                <FormFieldLabel>Exchange</FormFieldLabel>
                <FilterContainerColumnFilter
                  TypeaheadProps={typeaheadPropsZero}
                  column={exchange}
                  table={table}
                />
              </FormField>
              <FormField>
                <FormFieldLabel>Lot Size</FormFieldLabel>
                <FilterContainerColumnFilter
                  column={lotSize}
                  operator="between"
                />
              </FormField>
            </TableWithTabbedFilterContainerTemplate>
          </ContextPanelProvider>
        </DemoTableContainer>
      </FilterProvider>
    </>
  );
};

export const OrdersWithTabbedFilterContainerAndFilterProvider = () => {
  const table = useMemo<TableSchemaTable>(
    () => ({ module: "SIMUL", table: "parentOrders" }),
    [],
  );

  const [
    SavedFilterPanelProps,
    // prettier-ignore
    [vuuCreatedTimestamp, id, ric, side, price, ccy, exchange,quantity, status],
  ] = useMemo<
    [
      TabbedFilterContainerProps["SavedFilterPanelProps"],
      Array<ColumnDescriptor>,
    ]
  >(() => {
    const columns: ColumnDescriptor[] = [
      {
        label: "Vuu Created TS",
        name: "vuuCreatedTimestamp",
        serverDataType: "long",
        type: "time",
      },
      { name: "id", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
      { name: "side", serverDataType: "string" },
      { name: "price", serverDataType: "double" },
      { name: "ccy", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "quantity", serverDataType: "double" },
      { name: "status", serverDataType: "string" },
    ];
    return [{ availableColumns: columns }, columns];
  }, []);

  return (
    <>
      <style>{`
        .vuuFilterContainer {
            height: 100%;
        }
    `}</style>
      <FilterProvider>
        <DemoTableContainer>
          <ContextPanelProvider>
            <TableWithTabbedFilterContainerTemplate
              SavedFilterPanelProps={SavedFilterPanelProps}
              table="parentOrders"
            >
              <FormField>
                <FormFieldLabel>Vuu Created</FormFieldLabel>
                <FilterContainerColumnFilter
                  TypeaheadProps={typeaheadPropsOne}
                  column={vuuCreatedTimestamp}
                  operator="between"
                  table={table}
                />
              </FormField>
              <FormField>
                <FormFieldLabel>Order ID</FormFieldLabel>
                <FilterContainerColumnFilter
                  TypeaheadProps={typeaheadPropsOne}
                  column={id}
                  table={table}
                />
              </FormField>
              <FormField>
                <FormFieldLabel>RIC</FormFieldLabel>
                <FilterContainerColumnFilter
                  TypeaheadProps={typeaheadPropsOne}
                  column={ric}
                  table={table}
                />
              </FormField>
              <FormField>
                <FormFieldLabel>Side</FormFieldLabel>
                <FilterContainerColumnFilter
                  TypeaheadProps={typeaheadPropsZero}
                  column={side}
                  table={table}
                  values={["BUY", "SELL"]}
                  variant="toggle"
                />
              </FormField>
              <FormField>
                <FormFieldLabel>Price</FormFieldLabel>
                <FilterContainerColumnFilter column={price} table={table} />
              </FormField>
              <FormField>
                <FormFieldLabel>Quantity</FormFieldLabel>
                <FilterContainerColumnFilter
                  column={quantity}
                  operator="between"
                />
              </FormField>
              <FormField>
                <FormFieldLabel>Currency</FormFieldLabel>
                <FilterContainerColumnFilter
                  TypeaheadProps={typeaheadPropsZero}
                  column={ccy}
                  table={table}
                />
              </FormField>
              <FormField>
                <FormFieldLabel>Exchange</FormFieldLabel>
                <FilterContainerColumnFilter
                  TypeaheadProps={typeaheadPropsZero}
                  column={exchange}
                  table={table}
                />
              </FormField>
              <FormField>
                <FormFieldLabel>Status</FormFieldLabel>
                <FilterContainerColumnFilter
                  TypeaheadProps={typeaheadPropsZero}
                  column={status}
                  table={table}
                />
              </FormField>
            </TableWithTabbedFilterContainerTemplate>
          </ContextPanelProvider>
        </DemoTableContainer>
      </FilterProvider>
    </>
  );
};
