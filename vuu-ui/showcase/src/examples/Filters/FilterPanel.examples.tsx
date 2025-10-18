import { FormField, FormFieldLabel } from "@salt-ds/core";
import { FilterContainerColumnFilter, FilterPanel } from "@vuu-ui/vuu-filters";
import { FilterPanelProps } from "@vuu-ui/vuu-filters/src/filter-panel/FilterPanel";

const FilterPanelTemplate = ({
  children,
  filter,
  height = "100%",
}: Partial<FilterPanelProps> & {
  height?: string;
}) => {
  return (
    <>
      <style>{`
      .vuuFilterPanel {
        --vuuFilterPanel-height: ${height};
      }
    `}</style>
      <div style={{ height: 600, width: 300 }}>
        <FilterPanel filter={filter}>{children}</FilterPanel>
      </div>
    </>
  );
};

export const EmptyFilterPanelStandalone = () => <FilterPanelTemplate />;

export const FilterPanelSingleFilterStandalone = () => (
  <FilterPanelTemplate>
    <FormField>
      <FormFieldLabel>Currency</FormFieldLabel>
      <FilterContainerColumnFilter
        data-testid="ccy-1"
        column={{ name: "currency", serverDataType: "string" }}
      />
    </FormField>
  </FilterPanelTemplate>
);

export const FilterPanelMultipleFiltersStandaloneWithScrollbar = () => (
  <FilterPanelTemplate height="200px">
    <FormField>
      <FormFieldLabel>Id</FormFieldLabel>
      <FilterContainerColumnFilter
        column={{ name: "id", serverDataType: "string" }}
      />
    </FormField>
    <FormField>
      <FormFieldLabel>Name</FormFieldLabel>
      <FilterContainerColumnFilter
        column={{ name: "name", serverDataType: "string" }}
      />
    </FormField>
    <FormField>
      <FormFieldLabel>Description</FormFieldLabel>
      <FilterContainerColumnFilter
        column={{ name: "description", serverDataType: "string" }}
      />
    </FormField>
    <FormField>
      <FormFieldLabel>Currency</FormFieldLabel>
      <FilterContainerColumnFilter
        column={{ name: "currency", serverDataType: "string" }}
      />
    </FormField>
    <FormField>
      <FormFieldLabel>Exchange</FormFieldLabel>
      <FilterContainerColumnFilter
        column={{ name: "exchange", serverDataType: "string" }}
      />
    </FormField>
    <FormField>
      <FormFieldLabel>Lot Size</FormFieldLabel>
      <FilterContainerColumnFilter
        column={{ name: "lotSize", serverDataType: "int" }}
        operator="between"
      />
    </FormField>
  </FilterPanelTemplate>
);
