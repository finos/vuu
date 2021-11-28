import React, { forwardRef, useMemo, useImperativeHandle, useRef, useState } from 'react';
import cx from 'classnames';
import { useId } from '@vuu-ui/react-utils';
import { Dropdown } from '../dropdown';
import { useKeyboardNavigation, useSelection, SINGLE } from '../common-hooks';
import { List } from '../list';
import { useDropdown } from '../control-hooks';

// import '../form/controls/control.css';
import './select-base.css';

export const ComponentType = {
  Input: 'input',
  Dropdown: 'dropdown'
};

const defaultValueFormatter = (values) => (idx) => values[idx];

const getSelectedValue = (selection, selected, values) => {
  if (selected.length === 0) {
    return selection === SINGLE ? '' : [];
  }

  if (selection === SINGLE) {
    return values[selected[0]];
  } else {
    return selected.map((idx) => values[idx]);
  }
};

export default forwardRef(function SelectBase(
  {
    values,
    children: childRenderer,
    dropdownClassName,
    id: idProp,
    onCancel,
    onCommit,
    onFocus: onFocusProp,
    selection = SINGLE,
    typeToNavigate,
    value: propsValue,
    valueFormatter,
    ...props
  },
  ref
) {
  const id = useId(idProp);
  const inputEl = useRef(null);
  const dropdown = useRef(null);
  const formatValue = useMemo(
    () => valueFormatter || defaultValueFormatter(values),
    [valueFormatter, values]
  );

  const value = propsValue === null ? '' : propsValue;
  const count = values?.length ?? 0;

  const handleListChange = (evt, selected) => {
    // this is important for multiselection, but caused recursion now
    setSelected(selected);
    setIsOpen(false);
    const value = getSelectedValue(selection, selected, values);
    commit(value);
  };

  const {
    listHandlers: selectionListHandlers,
    selected,
    setSelected
  } = useSelection({
    onChange: handleListChange,
    selection,
    label: 'List'
  });

  const { highlightedIdx, hiliteItemAtIndex, listProps } = useKeyboardNavigation(
    {
      count,
      onFocus: onFocusProp,
      selectedIdx: values.indexOf(value),
      typeToNavigate,
      values,
      label: 'Select'
    },
    selectionListHandlers
  );

  const { dropdownHandlers, triggerHandlers, isOpen, setIsOpen } = useDropdown({
    highlightedIdx,
    id,
    onCancel
  });

  const handleMouseEnterListItem = (evt, idx) => {
    hiliteItemAtIndex(idx);
  };

  const [state, setState] = useState({
    value: value || '',
    initialValue: value || ''
  });

  useImperativeHandle(ref, () => ({ focus }));

  const focus = (selectText = true) => {
    if (inputEl.current) {
      inputEl.current.focus();
      if (selectText) {
        inputEl.current.select();
      }
    }
  };

  const handleBlur = () => {
    if (state.value !== state.initialValue) {
      //    commit();
    }
  };

  const handleCommit = (value) => {
    setIsOpen(false);
    commit(formatValue(value));
  };

  // this just means dropdown has closed without selection, do we really need to cancel anuthing ?
  // only if ESC was pressed ?
  const handleDropdownCancel = () => {
    focus(false);
  };

  const commit = (value = state.value) => {
    setState({
      ...state,
      value: value,
      initialValue: value
    });

    if (onCommit) {
      onCommit(value);
    }
  };

  const childComponent =
    typeof childRenderer === 'function' ? childRenderer(ComponentType.Input, props) : null;

  const inputProps = {
    ...listProps,
    ...triggerHandlers,
    id: `Select-${id}`,
    ref: inputEl,
    onBlur: handleBlur,
    // className: cx("hwControl-text",
    className: cx(childComponent ? childComponent.props.className : null, {
      'dropdown-showing': state.open
    })
  };

  const controlText = childComponent ? (
    React.cloneElement(childComponent, inputProps)
  ) : (
    <input {...inputProps} type="text" value={state.value} />
  );
  return (
    <>
      {controlText}
      <Dropdown
        ref={dropdown}
        className={dropdownClassName}
        componentName="List"
        anchorEl={inputEl.current}
        onCommit={handleCommit}
        onCancel={handleDropdownCancel}
        open={isOpen}>
        {renderDropdownComponent()}
      </Dropdown>
    </>
  );

  function renderDropdownComponent() {
    const dropdownComponent =
      typeof childRenderer === 'function' ? childRenderer(ComponentType.Dropdown, props) : null;

    return dropdownComponent ? (
      React.cloneElement(dropdownComponent, {
        onCommit: handleCommit
      })
    ) : (
      <List
        {...dropdownHandlers}
        id={id}
        onChange={handleListChange}
        onMouseEnterListItem={handleMouseEnterListItem}
        source={values}
        selected={selected}
        highlightedIdx={highlightedIdx}
      />
    );
  }
});
