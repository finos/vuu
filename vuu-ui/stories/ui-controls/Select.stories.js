import React from 'react';

import { Select } from '@vuu-ui/ui-controls';
import { ComponentAnatomy } from '@heswell/component-anatomy';

import { usa_states } from './usa_states';

import '@heswell/component-anatomy/esm/index.css';

const story = {
  title: 'UI Controls/Select',
  component: Select
};

export default story;

export const SimpleSelect = () => (
  <>
    <input type="text" defaultValue="start" />
    <div style={{ width: 150, height: 24, position: 'relative', border: 'solid 1px #ccc' }}>
      <Select values={usa_states} />
    </div>
    <input type="text" defaultValue="end" />
  </>
);

export const WithVisualiser = () => (
  <ComponentAnatomy showLegend>
    <Select values={usa_states} />
  </ComponentAnatomy>
);
