import { Dropdown } from "@heswell/salt-lab";
import { Density } from "@salt-ds/core";
import { HTMLAttributes, useCallback } from "react";
import cx from "classnames";

const classBase = "vuuDensitySwitch";

const densities: Density[] = ["high", "medium", "low", "touch"];
const DEFAULT_DENSITY = "high";

export interface DensitySwitchProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  defaultDensity?: Density;
  density?: Density;
  onChange: (density: Density) => void;
}

export const DensitySwitch = ({
  className: classNameProp,
  defaultDensity = DEFAULT_DENSITY,
  onChange,
}: DensitySwitchProps) => {
  const handleSelectionChange = useCallback(
    (_event, selectedItem) => {
      onChange(selectedItem);
    },
    [onChange]
  );

  const className = cx(classBase, classNameProp);

  return (
    <Dropdown<Density>
      className={className}
      source={densities}
      defaultSelected={defaultDensity}
      onSelectionChange={handleSelectionChange}
    />
  );
};
