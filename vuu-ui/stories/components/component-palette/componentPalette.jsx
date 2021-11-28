import React, { Component, useState } from 'react';
import './componentPalette.css';
import { uuid } from '@vuu-ui/utils';
import { Action, getLayoutModel, extendLayoutModel, stretchLayout } from '@vuu-ui/layout';

const header = true;
const resizeable = true;

const getDefaultComponents = () =>
  [
    <Component
      title="Blue Monday"
      iconBg="cornflowerblue"
      iconColor="white"
      style={{ backgroundColor: 'cornflowerblue', color: 'white' }}
      header
      resizeable
    />,
    <Component
      title="Ivory Tower"
      iconBg="ivory"
      style={{ backgroundColor: 'ivory', flex: 1 }}
      header
      resizeable
    />,
    <Component
      title="Ketchup"
      iconBg="tomato"
      style={{ backgroundColor: 'tomato', flex: 1 }}
      header
      resizeable
    />,
    <Component
      title="Army Drill"
      iconBg="khaki"
      style={{ backgroundColor: 'khaki', flex: 1 }}
      header
      resizeable
    />,
    <Component
      title="Brown Study"
      iconBg="brown"
      style={{ backgroundColor: 'brown', flex: 1 }}
      header
      resizeable
    />
  ].map((component) => {
    const model = getLayoutModel('Component', component.props);
    const layoutModel = extendLayoutModel(
      {
        ...model,
        style: {
          ...model.style,
          width: 150,
          height: 200
        }
      },
      '*' /* path */
    );
    stretchLayout(layoutModel);
    return layoutModel;
  });

const ComponentIcon = ({ children, color, backgroundColor, idx, text, onMouseDown }) => {
  const handleMouseDown = (evt) => onMouseDown(evt, idx);
  return (
    <div className="ComponentIcon" onMouseDown={handleMouseDown} style={{ color, backgroundColor }}>
      <span>{text}</span>
      {children}
    </div>
  );
};

export default function ComponentPalette({ components: propComponents, dispatch }) {
  const [components] = useState(propComponents || getDefaultComponents());

  function handleMouseDown(evt, idx) {
    console.log(`[ComponentPalette] mouseDown ${idx}`);
    const component = components[idx];
    const { left, top } = evt.currentTarget.getBoundingClientRect();

    dispatch({
      type: Action.DRAG_START,
      evt,
      layoutModel: { ...component, $id: uuid(1) },
      instructions: { DoNotRemove: true, DoNotTransform: true, dragThreshold: 0 },
      dragRect: { left, top, right: left + 100, bottom: top + 150 }
    });
  }

  function drop(icon) {
    console.log('ComponentPalette.drop');
    // var releaseSpace = true;
    // //this.props.onLayout('drop', {component:this.refs.component, dropTarget, releaseSpace});
    // // initialize the config for the new component
    // var { component, layout } = icon.props;
    // var { children, container, dragContainer, dragging, draggingSibling,
    //     onConfigChange, onLayout, onMeasure, ...rest } = component.props;

    // var config = {};
    // config[layout.id] = rest;
    // this.props.onMeasure(null, config);

    // var idx = this.state.dragging;
    // var layouts = this.state.layout.slice();
    // layouts[idx] = LayoutModel({ type: 'Component' })

    // this.setState({ dragging: -1, dragX: 0, dragY: 0, layout: layouts });
  }

  return (
    <div className="ComponentPalette">
      {components.map((component, idx) => (
        <ComponentIcon
          key={idx}
          idx={idx}
          text={component.props.title}
          color={component.props.iconColor || '#000'}
          backgroundColor={component.props.iconBg || '#333'}
          component={component}
          onMouseDown={handleMouseDown}
        ></ComponentIcon>
      ))}
    </div>
  );
}
