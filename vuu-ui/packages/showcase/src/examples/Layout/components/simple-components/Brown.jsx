import React from 'react';
import { Component, registerComponent } from '@vuu-ui/layout';

export const Brown = ({ style }) => {
  return <Component style={{ ...style, backgroundColor: 'brown' }} />;
};

registerComponent('Brown', Brown);
