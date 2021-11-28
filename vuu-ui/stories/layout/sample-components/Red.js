import React from 'react';
import { Component, registerComponent } from '@vuu-ui/layout';

const Red = ({ style }) => {
  return <Component style={{ ...style, backgroundColor: 'red' }} />;
};

export default Red;

registerComponent('Red', Red);
