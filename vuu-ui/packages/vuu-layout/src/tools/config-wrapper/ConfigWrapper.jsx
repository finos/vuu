import React, { useState } from 'react';

import { LayoutConfigurator, LayoutTreeViewer } from '..';
import { followPathToComponent } from '../..';

export const ConfigWrapper = ({ children }) => {
  const designMode = false;
  // const [designMode, setDesignMode] = useState(false);
  const [layout, setLayout] = useState(children);
  const [selectedComponent, setSelectedComponent] = useState(children);

  const handleSelection = (selectedPath) => {
    const targetComponent = followPathToComponent(layout, selectedPath);
    setSelectedComponent(targetComponent);
  };

  const handleChange = (property, value) => {
    console.log(`change ${property} -> ${value}`);

    // 2) replace selectedComponent and set layout
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
