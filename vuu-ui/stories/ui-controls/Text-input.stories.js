import React, { useCallback, useState } from 'react';
import { TextInput } from '@vuu-ui/ui-controls';

export default {
  title: 'UI Controls/TextInput',
  component: TextInput
};

export const SimpleInput = () => {
  const [controlledValue, setControlledValue] = useState('12');

  const handleControlledChange = (evt, value) => {
    setControlledValue(value);
  };

  const handleChange = (evt, value) => {
    console.log(`onChange ${value}`);
  };

  const handleCommit = (value) => {
    console.log(`onCommit ${value}`);
  };

  const handleCancel = () => {
    console.log(`onCancel`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label for="controlled">Controlled</label>
      <div
        style={{
          border: 'solid 1px #ccc',
          display: 'inline-block',
          position: 'relative',
          height: 26,
          width: 200
        }}
      >
        <TextInput
          id="controlled"
          value={controlledValue}
          onCancel={handleCancel}
          onChange={handleControlledChange}
          onCommit={handleCommit}
        />
      </div>
      <br />
      <label for="uncontrolled">Uncontrolled</label>
      <div
        style={{
          border: 'solid 1px #ccc',
          display: 'inline-block',
          position: 'relative',
          height: 26,
          width: 200
        }}
      >
        <TextInput
          id="uncontrolled"
          defaultValue="12"
          onChange={handleChange}
          onCommit={handleCommit}
        />
      </div>
    </div>
  );
};
