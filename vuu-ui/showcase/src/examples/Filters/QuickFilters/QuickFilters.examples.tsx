import { QuickFilters } from "@finos/vuu-filters";

let displaySequence = 1;

export const SearchOnly = () => {
  return <QuickFilters columns={[]} />;
};
SearchOnly.displaySequence = displaySequence++;

export const OneColumn = () => {
  return (
    <QuickFilters columns={[{ name: "ClientID", serverDataType: "string" }]} />
  );
};
OneColumn.displaySequence = displaySequence++;
