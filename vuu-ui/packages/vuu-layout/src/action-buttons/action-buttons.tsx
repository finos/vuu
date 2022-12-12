import React from "react";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@vuu-ui/ui-controls";
import { Button, ButtonProps } from "@heswell/uitk-core";

import "./action-buttons.css";

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
