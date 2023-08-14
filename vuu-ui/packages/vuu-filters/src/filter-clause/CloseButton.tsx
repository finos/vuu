import { Button } from "@salt-ds/core";
import "./CloseButton.css";

type CloseButtonProps = {
  classBase: string;
  onClick: () => void;
};

export const CloseButton = ({ classBase, onClick }: CloseButtonProps) => (
  <Button
    className={`${classBase}-closeButton`}
    data-icon="close"
    onClick={onClick}
    variant="secondary"
  />
);
