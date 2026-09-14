import { ItemPicker } from "@vuu-ui/vuu-ui-controls";

export const ModulePicker = () => (
  <ItemPicker
    allItems={[]}
    itemTypeName="module"
    onSelectedItemsChange={() => undefined}
    selectedItems={[]}
  />
);
