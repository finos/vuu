import { Dropdown, SelectionChangeHandler } from "@heswell/salt-lab";
import { Density } from "@salt-ds/core";
import { HTMLAttributes, useCallback, useContext } from "react";
import cx from "classnames";
import { ThemeContext } from "../theme-provider";

const classBase = "vuuDensitySwitch";

const densities:Density[] = ["high", "medium", "low", "touch"];
const DEFAULT_DENSITY = "high";

export interface DensitySwitchProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  defaultDensity?: Density;
  density?: Density;
}

export const DensitySwitch = ({
  className: classNameProp,
  defaultDensity=DEFAULT_DENSITY,
}:DensitySwitchProps) => {
  const { setDensity } = useContext(ThemeContext)
  const handleSelectionChange:SelectionChangeHandler | string = useCallback((_event, selectedItem) => {
    setDensity(selectedItem);
  }, [setDensity])

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