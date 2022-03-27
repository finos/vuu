import React from 'react';
import { Pill } from '@vuu-ui/ui-controls';

let displaySequence = 1;

export const SimplePill = () => {
  return <Pill label="GBP" />;
};
SimplePill.displaySequence = displaySequence++;

export const SelectablePill = () => {
  return <Pill label="GBP" selectable />;
};
SelectablePill.displaySequence = displaySequence++;

export const PillWithPrefix = () => {
  return <Pill label="GBP" prefix="ccy" selectable />;
};
PillWithPrefix.displaySequence = displaySequence++;

export const CloseablePill = () => {
  return <Pill label="GBP" prefix="CCY" closeable />;
};
CloseablePill.displaySequence = displaySequence++;

export const VerticalPill = () => {
  return <Pill label="GBP" orientation="vertical" prefix="CCY" closeable />;
};
VerticalPill.displaySequence = displaySequence++;
