import React, { useContext, useRef } from 'react';
import styled from '@emotion/styled';

let controlId = 0;

const StateButtonContext = React.createContext(null);

const StateButtonGroupRoot = styled.div`
  align-items: center;
  background-color: #ccc;
  display: inline-flex;
  padding: 1px;
`;

const StateButtonRoot = styled.div`
  background-color: white;
  color: #2C3E50;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  overflow: hidden;
  &:not(:first-of-type) {
    margin-left: 1px;
  }
  & input {
    position: absolute;
    left: -100px;
  }
  & input:checked + label {
    background-color: lightgrey;
  }
  & label {
    align-items: center;
    cursor: pointer;
    display: flex;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow; hidden;
  }
`;

const useStateButton = (props) => {
  const context = useContext(StateButtonContext);
  if (context) {
    return [context.name, context.onChange, context.value === props.value];
  } else {
    return [props.name, props.onChange, props.selected];
  }
};

const StateButtonGroup = ({ children, className, name, onChange, value }) => {
  const changeHandler = (e) => onChange(name, e.target.value);

  return (
    <StateButtonGroupRoot className={className}>
      <StateButtonContext.Provider value={{ name, onChange: changeHandler, value }}>
        {children}
      </StateButtonContext.Provider>
    </StateButtonGroupRoot>
  );
};

const StateButton = (props) => {
  const id = useRef(++controlId);
  const [name, onChange, checked] = useStateButton(props);
  const { label, value } = props;
  return (
    <StateButtonRoot className={props.className} title={label}>
      <input
        type="radio"
        id={id.current}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      <label htmlFor={id.current}>{props.children}</label>
    </StateButtonRoot>
  );
};

StateButton.Group = StateButtonGroup;

export default StateButton;
