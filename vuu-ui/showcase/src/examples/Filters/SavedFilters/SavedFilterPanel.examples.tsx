import { SavedFilterDescriptor, SavedFilterPanel } from "@vuu-ui/vuu-filters";
import { CSSProperties, useMemo } from "react";

const style = {
  height: 600,
  width: 330,
} as CSSProperties;

export const EmptySavedFilterPanel = () => {
  return <SavedFilterPanel filterDescriptors={[]} style={style} />;
};

export const SavedFilterPanelOneFilter = () => {
  const filterDescriptors = useMemo<SavedFilterDescriptor[]>(
    () => [
      {
        name: "Test Filter",
        filter: { column: "currency", op: ">", value: "GBP" },
      },
    ],
    [],
  );
  return (
    <SavedFilterPanel filterDescriptors={filterDescriptors} style={style} />
  );
};

export const SavedFilterPanelFiveFilters = () => {
  const filterDescriptors = useMemo<SavedFilterDescriptor[]>(
    () => [
      {
        name: "Test Filter 1",
        filter: { column: "currency", op: "=", value: "GBP" },
      },
      {
        name: "Test Filter 2",
        filter: { column: "exchange", op: "=", value: "NASDAQ" },
      },
      {
        name: "Test Filter 3 has quite a long name",
        filter: {
          op: "and",
          filters: [
            { column: "currency", op: "=", value: "GBP" },
            { column: "exchange", op: "=", value: "NASDAQ" },
          ],
        },
      },
      {
        name: "Test Filter 4",
        filter: {
          op: "and",
          filters: [
            { column: "price", op: ">", value: 2000 },
            { column: "volume", op: ">", value: 1000 },
          ],
        },
      },
      {
        name: "Test Filter 5",
        filter: {
          op: "and",
          filters: [
            { column: "price", op: ">", value: 2000 },
            { column: "volume", op: ">", value: 1000 },
            { column: "created", op: "<", value: Date.now() },
          ],
        },
      },
    ],
    [],
  );
  return (
    <SavedFilterPanel filterDescriptors={filterDescriptors} style={style} />
  );
};

export const SavedFilterPanelManyFilters = () => {
  const filterDescriptors = useMemo<SavedFilterDescriptor[]>(
    () =>
      new Array(100).fill(0).map((_, i) => ({
        name: `Test Filter ${i + 1}`,
        filter: { column: "currency", op: "=", value: "GBP" },
      })),
    [],
  );
  return (
    <SavedFilterPanel filterDescriptors={filterDescriptors} style={style} />
  );
};
