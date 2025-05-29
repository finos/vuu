import { Icon } from "@vuu-ui/vuu-ui-controls";
import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
} from "@salt-ds/core";

export const TableLayoutToggleButton = (props: ToggleButtonGroupProps) => {
  return (
    <ToggleButtonGroup {...props}>
      <ToggleButton
        className="vuuIconToggleButton"
        value={0}
        aria-label="Tabbed View"
      >
        <Icon name="split-v" size={18} />
      </ToggleButton>
      <ToggleButton
        className="vuuIconToggleButton"
        value={1}
        aria-label="Side by side view"
      >
        <Icon name="tabs" size={18} />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
