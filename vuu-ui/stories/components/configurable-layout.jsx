import React, { useRef, useState, useCallback } from 'react';
import {
  Action,
  adjustHeaderPosition,
  isLayoutProperty,
  mapCSSProperties,
  deriveVisualBorderStyle,
  followPath
} from '@vuu-ui/layout';
import LayoutConfigurator from './layout-configurator';
import { LayoutTreeViewer } from './layout-tree-viewer';

const NO_STYLES = {};

const SIZE = { width: 820, height: 400 };

export default function ConfigurableLayout({ children }) {
  const [managedLayoutNode, setManagedLayoutNode] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const layoutDispatcher = useRef(null);

  function onChange(propertyName, value) {
    const { $path, header, style, layoutStyle, visualStyle, ...model } = getSelectedLayoutNode();
    // TODO refactor to use same code as stretch, using collectSTyles
    const newLayoutStyle = {
      ...layoutStyle,
      [propertyName]: value
    };

    const newVisualStyle = {
      ...visualStyle
    };

    for (
      let i = 0, properties = mapCSSProperties([propertyName, value]);
      i < properties.length;
      i += 2
    ) {
      if (isLayoutProperty(properties[i])) {
        newLayoutStyle[properties[i]] = properties[i + 1];
      } else {
        newVisualStyle[properties[i]] = properties[i + 1];
      }
    }

    for (
      let i = 0, properties = deriveVisualBorderStyle(newLayoutStyle);
      i < properties.length;
      i += 2
    ) {
      newVisualStyle[properties[i]] = properties[i + 1];
    }

    const replacementNode = {
      $path,
      ...model,
      header: adjustHeaderPosition(header, newLayoutStyle),
      style: {
        ...style,
        [propertyName]: value
      },
      layoutStyle: newLayoutStyle,
      visualStyle: newVisualStyle
    };

    layoutDispatcher.current({
      type: Action.REPLACE,
      target: selectedLayoutNode,
      replacement: replacementNode
    });
  }

  const onLayoutModel = useCallback(
    (layoutModel, dispatcher) => {
      if (layoutDispatcher.current === null) {
        layoutDispatcher.current = dispatcher;
      }
      if (selectedPath === null) {
        const [layoutChild] = layoutModel.children;
        setSelectedPath(layoutChild.$path);
      }
      setManagedLayoutNode(layoutModel);
    },
    [selectedPath]
  );

  function selectComponent(layoutNode) {
    setSelectedPath(layoutNode.$path);
  }

  function getSelectedLayoutNode() {
    if (managedLayoutNode && selectedPath) {
      return followPath(managedLayoutNode, selectedPath);
    } else {
      return null;
    }
  }

  // const {selectedLayoutNode, layoutModel} = this.state;
  const selectedLayoutNode = getSelectedLayoutNode();
  const [layoutStyle, visualStyle] =
    selectedLayoutNode === null
      ? [NO_STYLES, NO_STYLES]
      : [selectedLayoutNode.layoutStyle, selectedLayoutNode.visualStyle];

  return (
    <div style={{ width: 820, height: 800, position: 'relative' }}>
      <Surface style={{ width: 820, height: 800 }}>
        <DynamicContainer style={SIZE} root onLayoutModel={onLayoutModel}>
          {children}
        </DynamicContainer>

        <LayoutTreeViewer
          style={{ position: 'absolute', top: 400, left: 0, width: 400, height: 400 }}
          tree={managedLayoutNode}
          selectedPath={selectedPath}
          onSelectNode={selectComponent}
        />

        <LayoutConfigurator
          style={{ position: 'absolute', top: 400, left: 420, width: 400, height: 400 }}
          layoutStyle={layoutStyle}
          visualStyle={visualStyle}
          onChange={onChange}
        />
      </Surface>
    </div>
  );
}
