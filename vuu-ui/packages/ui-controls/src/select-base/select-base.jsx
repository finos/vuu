import React, {
  forwardRef,
  useCallback,
  useMemo,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import cx from 'classnames';
import { useId } from '@vuu-ui/react-utils';
import { Dropdown, useDropdown } from '../dropdown';
import { useItemsWithIds, SINGLE } from '../common-hooks';
import { List } from '../list';
import { useSelect } from './useSelect';

import './select-base.css';

export const ComponentType = {
  Input: 'input',
  Dropdown: 'dropdown'
};

const defaultValueFormatter = (values) => (idx) => values[idx];

export default forwardRef(function SelectBase(
  {
    source,
    children: childRenderer,
    defaultSelected,
    dropdownClassName,
    id: idProp,
    onCancel,
    onCommit,
    onFocus: onFocusProp,
    selected: selectedProp,
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
  const listRef = useRef(null);
  const dropdown = useRef(null);

  const value = propsValue === null ? '' : propsValue;

  const [state, setState] = useState({
    value: value || '',
    initialValue: value || ''
  });

  const [, sourceWithIds, sourceItemById] = useItemsWithIds(source, id, {
    label: 'SelectBase'
  });

  const { dropdownHandlers, triggerHandlers, isOpen, setIsOpen } = useDropdown({
    id,
    onCancel
  });

  const commit = useCallback(
    (value = state.value) => {
      setState({
        ...state,
        value: value,
        initialValue: value
      });

      if (onCommit) {
        onCommit(value);
      }
    },
    [onCommit, state]
  );

  const getSelectedValue = useCallback(
    (selected) => {
      if (selected.length === 0) {
        return selection === SINGLE ? '' : [];
      }
      if (selection === SINGLE) {
        return sourceItemById(selected[0]);
      } else {
        return selected.map(sourceItemById);
      }
    },
    [selection, sourceItemById]
  );

  const handleChange = useCallback(
    (evt, selected) => {
      setIsOpen(false);
      const value = getSelectedValue(selected);
      commit(value);
    },
    [commit, getSelectedValue, setIsOpen]
  );

  const { highlightedIdx, listItemHandlers, listProps, selected } = useSelect({
    defaultSelected,
    id,
    onChange: handleChange,
    selected: selectedProp,
    selection,
    sourceWithIds
  });

  const formatValue = useMemo(
    () => valueFormatter || defaultValueFormatter(source),
    [valueFormatter, source]
  );

  useImperativeHandle(ref, () => ({ focus }));

  const focus = (selectText = true) => {
    if (inputEl.current) {
      inputEl.current.focus();
      if (selectText) {
        inputEl.current.select();
      }
    }
  };

  const handleBlur = (evt) => {
    if (!listRef.current?.contains(evt.relatedTarget)) {
      console.log({ target: evt.relatedTarget });
      // If we are multiselect and selections have been made, commit them
      // if (state.value !== state.initialValue) {
      //   //    commit();
      // }
      setIsOpen(false);
    }
  };

  const handleCommit = (value) => {
    setIsOpen(false);
    commit(formatValue(value));
  };

  const childComponent =
    typeof childRenderer === 'function' ? childRenderer(ComponentType.Input, props) : null;

  const inputProps = {
    ...listProps,
    ...triggerHandlers,
    id: `Select-${id}`,
    ref: inputEl,
    onBlur: handleBlur,
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
        listItemHandlers={listItemHandlers}
        onChange={handleChange}
        ref={listRef}
        source={source}
        selected={selected}
        highlightedIdx={highlightedIdx}
      />
    );
  }
});
