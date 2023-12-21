import { CheckboxIcon } from "../list/CheckboxIcon";

import "./Checkbox.css";

type CheckboxProps = {
  onToggle: () => void;
  className?: string;
  checked: boolean;
  label: string;
};

export const Checkbox = (props: CheckboxProps): JSX.Element => {
  const { onToggle, checked, label } = props;

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
