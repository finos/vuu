import React from 'react';
import { Pill, Pillbox } from '@vuu-ui/ui-controls';

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

export const PillboxThreePills = () => {
  return (
    <Pillbox>
      <Pill label="LDN/ASIX" prefix="Exchange:" closeable />
      <Pill label="GBP" prefix="CCY:" closeable />
      <Pill label="SEK" prefix="CCY:" closeable />
    </Pillbox>
  );
};
Pillbox.displaySequence = displaySequence++;
