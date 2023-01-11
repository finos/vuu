import React, { useState } from 'react';

import { LayoutConfigurator, LayoutTreeViewer } from '..';
import { followPathToComponent } from '../..';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ConfigWrapper = ({ children }: any) => {
  const designMode = false;
  const [layout, setLayout] = useState(children);
  const [selectedComponent, setSelectedComponent] = useState(children);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelection = (selectedPath: any) => {
    const targetComponent = followPathToComponent(layout, selectedPath);
    setSelectedComponent(targetComponent);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (property: any, value: any) => {
    console.log(`change ${property} -> ${value}`);

    const newComponent = React.cloneElement(selectedComponent, {
      style: {
        ...selectedComponent.props.style,
        [property]: value
      }
    });
    setSelectedComponent(newComponent);
    setLayout(React.cloneElement(layout, null, newComponent));
  };

  return (
    <div data-design-mode={`${designMode}`}>
      {layout}
      <br />
      <div style={{ display: 'flex' }}>
        <LayoutConfigurator
          height={300}
          managedStyle={selectedComponent.props.style}
          width={300}
          onChange={handleChange}
          style={undefined}
        />
        <LayoutTreeViewer
          layout={layout}
          onSelect={handleSelection}
          style={{ width: 300, height: 300, backgroundColor: '#ccc' }}
        />
      </div>
      {/* <StateButton
        defaultChecked={false}
        onChange={(e, value) => setDesignMode(value)}>Design Mode</StateButton> */}
    </div>
  );
};
