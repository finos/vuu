import React from "react";
import {
  AddIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  CloseIcon,
  MaximizeIcon,
  MinimizeIcon,
  MoreSmallListVertIcon,
} from "@vuu-ui/ui-controls";
import { Button, ButtonProps } from "@heswell/uitk-core";

import "./action-buttons.css";

export const AddButton = (props: ButtonProps) => (
  <Button
    className="hwActionButton"
    variant="secondary"
    aria-label="Add"
    {...props}
  >
    <AddIcon />
  </Button>
);

export const ChevronDoubleLeftButton = (props: ButtonProps) => (
  <Button
    className="hwActionButton"
    variant="secondary"
    aria-label="Close"
    {...props}
  >
    <ChevronDoubleLeftIcon />
  </Button>
);

export const ChevronDoubleRightButton = (props: ButtonProps) => (
  <Button
    className="hwActionButton"
    variant="secondary"
    aria-label="Close"
    {...props}
  >
    <ChevronDoubleRightIcon />
  </Button>
);

export const CloseButton = (props: ButtonProps) => (
  <Button
    className="hwActionButton"
    variant="secondary"
    aria-label="Close"
    {...props}
  >
    <CloseIcon />
  </Button>
);

export const MaximizeButton = () => (
  <Button className="hwActionButton" variant="secondary" aria-label="Maximize">
    <MaximizeIcon />
  </Button>
);

export const MinimizeButton = () => (
  <Button className="hwActionButton" variant="secondary" aria-label="Minimize">
    <MinimizeIcon />
  </Button>
);

export const MoreSmallListVertButton = () => (
  <Button className="hwActionButton" variant="secondary" aria-label="Minimize">
    <MoreSmallListVertIcon />
  </Button>
);
