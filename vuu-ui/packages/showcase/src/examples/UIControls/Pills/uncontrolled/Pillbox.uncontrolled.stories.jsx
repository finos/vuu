import React from 'react';
import { Pill, Pillbox } from '@vuu-ui/ui-controls';

let displaySequence = 1;

export const PillboxThreePills = () => {
  return (
    <Pillbox>
      <Pill label="LDN/ASIX" prefix="Exchange:" closeable />
      <Pill label="GBP" prefix="CCY:" closeable />
      <Pill label="SEK" prefix="CCY:" closeable />
    </Pillbox>
  );
};
PillboxThreePills.displaySequence = displaySequence++;

export const PillboxThreeVerticalPills = () => {
  return (
    <>
      <input type="text" />
      <br />
      <br />
      <Pillbox>
        <Pill label="LDN/ASIX" orientation="vertical" prefix="Exchange:" closeable />
        <Pill label="GBP" orientation="vertical" prefix="CCY:" closeable />
        <Pill label="SEK" orientation="vertical" prefix="CCY:" closeable />
      </Pillbox>
    </>
  );
};
PillboxThreeVerticalPills.displaySequence = displaySequence++;
