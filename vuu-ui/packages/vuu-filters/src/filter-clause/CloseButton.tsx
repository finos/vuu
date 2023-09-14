import { Button } from "@salt-ds/core";
import "./CloseButton.css";

type CloseButtonProps = {
  className: string;
  onClick: () => void;
};

export const CloseButton = ({ className, onClick }: CloseButtonProps) => (
  <Button
    className={className}
    data-icon="close"
    onClick={onClick}
    variant="secondary"
  />
);
