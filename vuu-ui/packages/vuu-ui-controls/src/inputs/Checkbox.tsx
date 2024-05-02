import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import { CheckboxIcon } from "../list/CheckboxIcon";

import checkboxCss from "./Checkbox.css";

type CheckboxProps = {
  onToggle: () => void;
  className?: string;
  checked: boolean;
  label: string;
};

export const Checkbox = (props: CheckboxProps): JSX.Element => {
  const { onToggle, checked, label } = props;
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-checkbox",
    css: checkboxCss,
    window: targetWindow,
  });

  return (
    <div
      className="vuuCheckbox"
      onClick={onToggle}
      onKeyUp={(e) => e.key === " " && onToggle()}
    >
      <CheckboxIcon tabIndex={0} checked={checked} />
      {label}
    </div>
  );
};
