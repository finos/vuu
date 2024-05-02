import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { RadioIcon } from "../list";

import radioButtonCss from "./RadioButton.css";

type RadioButtonProps = {
  onClick: () => void;
  checked: boolean;
  label: string;
  groupName: string;
};

export const RadioButton = (props: RadioButtonProps): JSX.Element => {
  const { onClick, checked, label, groupName } = props;
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-radio-button",
    css: radioButtonCss,
    window: targetWindow,
  });

  return (
    <div className="vuuRadioButton" onClick={onClick}>
      <div className="radio">
        <input type="radio" name={groupName} />
        <RadioIcon checked={checked} />
      </div>
      {label}
    </div>
  );
};
