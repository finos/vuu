import { Dropdown } from "@heswell/salt-lab";
import { Density } from "@salt-ds/core";
import { HTMLAttributes, useCallback } from "react";
import cx from "classnames";

const classBase = "vuuDensitySwitch";

const densities:Density[] = ["high", "medium", "low", "touch"];
const DEFAULT_DENSITY = "high";

export interface DensitySwitchProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  defaultDensity?: Density;
  density?: Density;
  onDensityChange: (density: Density) => void;
}

export const DensitySwitch = ({
  className: classNameProp,
  defaultDensity=DEFAULT_DENSITY,
  onDensityChange,
}:DensitySwitchProps) => {
  const handleSelectionChange = useCallback((_event, selectedItem) => {
    onDensityChange(selectedItem);
  }, [onDensityChange])

  const className = cx(classBase, classNameProp);

  return (
    <Dropdown
    className={className}
    source={densities}
    defaultSelected={defaultDensity}
    onSelectionChange={handleSelectionChange}
    />
  )
}