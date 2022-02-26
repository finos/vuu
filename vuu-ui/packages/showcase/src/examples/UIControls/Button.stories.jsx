import React from 'react';

import { ComponentAnatomy } from '@heswell/component-anatomy';
import { Button, StateButton } from '@vuu-ui/ui-controls';
import '@vuu-ui/theme';

import '@heswell/component-anatomy/esm/index.css';

export const DefaultButton = () => {
  const handleClick = (e) => {
    console.log('Button click');
  };
  console.log(`render example`);
  return <Button onClick={handleClick}>Button</Button>;
};

export const DefaultStateButton = () => {
  const handleChange = (e, value) => {
    console.log(`Button click, new state = ${value}`);
  };
  console.log(`render example`);
  return (
    <StateButton defaultChecked={false} onChange={handleChange}>
      Button
    </StateButton>
  );
};

export const WithRenderVisualiser = () => {
  const handleChange = (e, value) => {
    console.log(`Button click, new state = ${value}`);
  };
  console.log(`render example`);
  return (
    <ComponentAnatomy>
      <StateButton defaultChecked={false} onChange={handleChange}>
        Button
      </StateButton>
    </ComponentAnatomy>
  );
};
