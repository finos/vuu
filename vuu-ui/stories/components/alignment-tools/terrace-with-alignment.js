import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Action, FlexBox } from '@vuu-ui/layout';
import { DesignProvider, LayoutToolbar, recomputeLayoutStyle } from '../design-time';

const RedBox = styled.div`
  background-color: red;
`;

const BrownBox = styled.div`
  background-color: brown;
  color: ivory;
`;

const BlueBox = styled.div`
  background-color: cornflowerblue;
`;

const IvoryBox = styled.div`
  background-color: ivory;
`;

const inputStyle = { flex: '1 1 auto' };

const StyledInput = styled.input`
  height: 24px;
`;

const Input = (props) => {
  const handleClick = (e) => e.stopPropagation();
  return (
    <StyledInput
      placeholder={props.placeholder}
      onClick={handleClick}
      value={props.value}
      onChange={props.onChange}
    />
  );
};

const SizePanel = ({ dispatch, style, selectedLayoutModel }) => {
  const { width, height, flex } = selectedLayoutModel
    ? selectedLayoutModel.style
    : { width: '', height: '', flex: '' };

  console.log(width, height, style);

  const handleChange = (name, value) => {
    const parsedValue = isNaN(parseInt(value, 10)) ? value : parseInt(value, 10);

    const replacement = recomputeLayoutStyle(selectedLayoutModel, name, parsedValue);
    console.log({ replacement });
    dispatch({
      type: Action.REPLACE,
      target: selectedLayoutModel,
      replacement
    });
  };

  return (
    <div style={style}>
      <Input
        placeholder="width"
        value={width || ''}
        onChange={(e) => handleChange('width', e.target.value)}
      />
      <Input
        placeholder="height"
        value={height || ''}
        onChange={(e) => handleChange('height', e.target.value)}
      />
      <Input
        placeholder="flex"
        value={flex || ''}
        onChange={(e) => handleChange('flex', e.target.value)}
      />
    </div>
  );
};

export const TerraceAlignment = () => {
  const [selectedLayoutModel, setSelectedLayoutModel] = useState(null);

  return (
    <DesignProvider onSelect={setSelectedLayoutModel}>
      <FlexBox style={{ width: 900, height: 400 }}>
        <FlexBox
          header={{ height: 61, component: LayoutToolbar }}
          style={{
            flex: 1,
            border: '2px solid black'
          }}
        >
          <RedBox style={inputStyle}>Item 1</RedBox>
          <IvoryBox style={inputStyle}>Item 2</IvoryBox>
          <BrownBox style={inputStyle}> Item 3</BrownBox>
          <BlueBox style={inputStyle}>Item 4</BlueBox>
        </FlexBox>
        <SizePanel style={{ width: 300 }} selectedLayoutModel={selectedLayoutModel} />
      </FlexBox>
    </DesignProvider>
  );
};
