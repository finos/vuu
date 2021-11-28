import React from 'react';
import {
  AddIcon,
  Button,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  CloseIcon,
  MaximizeIcon,
  MinimizeIcon,
  MoreSmallListVertIcon
} from '@vuu-ui/ui-controls';

import './action-buttons.css';

export const AddButton = ({ onClick, ...rest }) => (
  <Button
    className="hwActionButton"
    variant="secondary"
    aria-label="Add"
    onClick={onClick}
    {...rest}
  >
    <AddIcon />
  </Button>
);

export const ChevronDoubleLeftButton = ({ onClick, ...rest }) => (
  <Button
    className="hwActionButton"
    variant="secondary"
    aria-label="Close"
    onClick={onClick}
    {...rest}
  >
    <ChevronDoubleLeftIcon />
  </Button>
);

export const ChevronDoubleRightButton = ({ onClick, ...rest }) => (
  <Button
    className="hwActionButton"
    variant="secondary"
    aria-label="Close"
    onClick={onClick}
    {...rest}
  >
    <ChevronDoubleRightIcon />
  </Button>
);

export const CloseButton = (props) => (
  <Button className="hwActionButton" variant="secondary" aria-label="Close" {...props}>
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
