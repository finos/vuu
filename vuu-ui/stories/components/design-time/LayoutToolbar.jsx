import React from 'react';
import styled from '@emotion/styled';
import { Action } from '@vuu-ui/layout';
import StateButton from './state-button';
import LayoutIcon from './assets/LayoutIcon';
import LayoutToolbarContext from './LayoutToolbarContext';
import { recomputeLayoutStyle } from './design-utils';

const LayoutToolbar = styled.div`
  background-color: white;
  border-bottom: solid 1px #ccc;
  box-sizing: border-box;
  padding: 3px;
  & .icon {
    fill: #666;
    & rect:last-child {
      fill: saddlebrown;
    }
  }
`;

const ToolbarInnerContainer = styled.div`
  display: inline-flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  & .StateButtonGroup {
  }
`;

const DesignTimeToolbar = (props) => {
  const { dispatch, layoutModel } = props;
  const {
    style: { alignItems = 'stretch', flexDirection = 'row', justifyContent = 'flex-start' }
  } = layoutModel;

  const handleChange = (name, value) => {
    const replacement = recomputeLayoutStyle(layoutModel, name, value);

    dispatch({
      type: Action.REPLACE,
      target: layoutModel,
      replacement
    });
  };

  return (
    <LayoutToolbar style={props.style}>
      <LayoutToolbarContext.Provider value={{ alignItems, flexDirection, justifyContent }}>
        <select
          value={flexDirection}
          onChange={(e) => handleChange('flexDirection', e.target.value)}
        >
          <option value="row">Row</option>
          <option value="column">Column</option>
        </select>
        <ToolbarInnerContainer>
          <StateButton.Group
            className="StateButtonGroup"
            name="alignItems"
            onChange={handleChange}
            value={alignItems}
          >
            <StateButton label="Start" value="flex-start">
              <LayoutIcon name="terrace-align-flex-start" />
            </StateButton>
            <StateButton label="Baseline" value="baseline" disabled={flexDirection === 'column'}>
              <LayoutIcon name="terrace-align-baseline" />
            </StateButton>
            <StateButton label="Center" value="center">
              <LayoutIcon name="terrace-align-center" />
            </StateButton>
            <StateButton label="End" value="flex-end">
              <LayoutIcon name="terrace-align-flex-end" />
            </StateButton>
            <StateButton label="Stretch" value="stretch">
              <LayoutIcon name="terrace-align-stretch" />
            </StateButton>
          </StateButton.Group>
          <StateButton.Group
            className="StateButtonGroup"
            name="justifyContent"
            onChange={handleChange}
            value={justifyContent}
          >
            <StateButton label="Start" value="flex-start">
              <LayoutIcon name="terrace-justify-flex-start" />
            </StateButton>
            <StateButton label="Space around" value="space-around">
              <LayoutIcon name="terrace-justify-space-around" />
            </StateButton>
            <StateButton label="Space between " value="space-between">
              <LayoutIcon name="terrace-justify-space-between" />
            </StateButton>
            <StateButton label="Center" value="center">
              <LayoutIcon name="terrace-justify-center" />
            </StateButton>
            <StateButton label="End" value="flex-end">
              <LayoutIcon name="terrace-justify-flex-end" />
            </StateButton>
          </StateButton.Group>
        </ToolbarInnerContainer>
      </LayoutToolbarContext.Provider>
    </LayoutToolbar>
  );
};

export default DesignTimeToolbar;
