import { FilterContainerFilterDescriptor } from "@vuu-ui/vuu-filter-types";
import { FilterProvider, SavedFilterPanel } from "@vuu-ui/vuu-filters";
import { CSSProperties, useMemo } from "react";

const style = {
  height: 600,
  width: 330,
} as CSSProperties;

const SavedFilterPanelTemplate = () => {
  return (
    <>
      <SavedFilterPanel style={style} />
    </>
  );
};

export const EmptySavedFilterPanel = () => {
  return <SavedFilterPanelTemplate />;
};

export const SavedFilterPanelOneFilter = () => {
  const filterDescriptors = useMemo<FilterContainerFilterDescriptor[]>(
    () => [
      {
        active: false,
        filter: {
          column: "currency",
          name: "Test Filter",
          op: ">",
          value: "GBP",
        },
        id: "filter-1",
      },
    ],
    [],
  );
  return (
    <FilterProvider savedFilters={filterDescriptors}>
      <SavedFilterPanelTemplate />
    </FilterProvider>
  );
};

export const SavedFilterPanelFiveFiltersCustomStyles = () => {
  const filterDescriptors = useMemo<FilterContainerFilterDescriptor[]>(
    () => [
      {
        active: false,
        filter: {
          column: "currency",
          name: "Test Filter 1",
          op: "=",
          value: "GBP",
        },
        id: "filter-1",
      },
      {
        active: false,
        filter: {
          column: "exchange",
          name: "Test Filter 2",
          op: "=",
          value: "NASDAQ",
        },
        id: "filter-2",
      },
      {
        active: false,
        filter: {
          name: "Test Filter 3 has quite a long name",
          op: "and",
          filters: [
            { column: "currency", op: "=", value: "GBP" },
            { column: "exchange", op: "=", value: "NASDAQ" },
          ],
        },
        id: "filter-3",
      },
      {
        active: false,
        filter: {
          name: "Test Filter 4",
          op: "and",
          filters: [
            { column: "price", op: ">", value: 2000 },
            { column: "volume", op: ">", value: 1000 },
          ],
        },
        id: "filter-4",
      },
      {
        active: false,
        filter: {
          name: "Test Filter 5",
          op: "and",
          filters: [
            { column: "price", op: ">", value: 2000 },
            { column: "volume", op: ">", value: 1000 },
            { column: "created", op: "<", value: Date.now() },
          ],
        },
        id: "test-5",
      },
    ],
    [],
  );

  return (
    <>
      <style>{` 
      .vuuSavedFilterPanel {
        --vuuSavedFilterPanel-background: rgb(21,39,59);
        .vuuFilterPillNext {
          border-radius: 18px;
          display: inline-block;
          height: 36px;
        }
      }
      `}</style>
      <FilterProvider savedFilters={filterDescriptors}>
        <SavedFilterPanelTemplate />
      </FilterProvider>
    </>
  );
};

export const SavedFilterPanelManyFilters = () => {
  const filterDescriptors = useMemo<FilterContainerFilterDescriptor[]>(
    () =>
      new Array(100).fill(0).map((_, i) => ({
        active: false,
        filter: {
          column: "currency",
          name: `Test Filter ${i + 1}`,
          op: "=",
          value: "GBP",
        },
        id: `filter-${i}`,
      })),
    [],
  );
  return (
    <FilterProvider savedFilters={filterDescriptors}>
      <SavedFilterPanelTemplate />
    </FilterProvider>
  );
};
