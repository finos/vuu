import { RadioIcon } from "@finos/vuu-ui-controls";

import "./RadioButton.css";

type RadioButtonProps = {
  onClick: () => void,
  checked: boolean,
  label: string,
  groupName: string
}

export const RadioButton = (props: RadioButtonProps): JSX.Element => {
  const { onClick, checked, label, groupName } = props;

  return (
    <div className="vuuRadioButton" onClick={onClick}>
      <div className="radio">
        <input
          type="radio"
          name={groupName}
        />
        <RadioIcon checked={checked} />
      </div>
      {label}
    </div>
  )
}
