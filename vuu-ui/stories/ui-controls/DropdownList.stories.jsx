import React, { useRef, useState } from 'react';

import { DropdownList } from '@vuu-ui/ui-controls';
import { usa_states } from './usa_states';

import { ComponentAnatomy } from '@heswell/component-anatomy';

const story = {
  title: 'UI Controls/DropdownList',
  component: DropdownList
};

export default story;

export const DefaultDropdownList = () => {
  const handleCommit = (value) => {
    console.log(`new value = ${value}`);
  };
  return (
    <div>
      <DropdownList source={usa_states} onCommit={handleCommit} />
    </div>
  );
};

export const MultiSelectDropdownList = () => {
  return (
    <div>
      <DropdownList selection="checkbox-only" source={usa_states} />
    </div>
  );
};
