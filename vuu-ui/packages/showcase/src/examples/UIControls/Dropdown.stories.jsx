import React, { useRef, useState } from 'react';

import { Button, Dropdown, List, useDropdown } from '@vuu-ui/ui-controls';
import { usa_states } from './List/List.data';

import { ComponentAnatomy } from '@heswell/component-anatomy';

const story = {
  title: 'UI Controls/Dropdown',
  component: List
};

export default story;

let displaySequence = 1;

export const SimpleListWithDropdown = () => {
  const openRef = useRef(false);
  const button = useRef(null);
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');
  const toggle = () => {
    setOpen((isOpen) => {
      return (openRef.current = !isOpen);
    });
    requestAnimationFrame(() => {
      if (!openRef.current) {
        requestAnimationFrame(() => {
          button.current.focus();
        });
      }
    });
  };
  const handleSelection = (e, [idx]) => {
    setSelectedValue(usa_states[idx]);
    toggle();
  };
  return (
    <>
      <ComponentAnatomy>
        <div>
          <span style={{ display: 'inline-block', width: 140 }}>{selectedValue}</span>
          <Button active={open} ref={button} onClick={toggle} style={{ width: 60 }}>
            {open ? 'Close' : 'Open'}
          </Button>
          <Dropdown
            autofocus
            align="bottom-right"
            anchorEl={button.current}
            onCancel={toggle}
            open={open}
            width={200}>
            <List source={usa_states} onChange={handleSelection} />
          </Dropdown>
        </div>
      </ComponentAnatomy>
    </>
  );
};

SimpleListWithDropdown.displaySequence = displaySequence++;

export const SimpleListWithDropdownHook = () => {
  const button = useRef(null);
  const [selectedValue, setSelectedValue] = useState('');

  const handleSelection = (e, [idx]) => {
    setSelectedValue(usa_states[idx]);
    requestAnimationFrame(() => {
      button.current.focus();
    });
  };

  const { dropdownHandlers, triggerHandlers, isOpen } = useDropdown({
    onChange: handleSelection
  });

  return (
    <>
      <ComponentAnatomy>
        <div>
          <span style={{ display: 'inline-block', width: 140 }}>{selectedValue}</span>
          <Button {...triggerHandlers} active={isOpen} ref={button} style={{ width: 60 }}>
            {isOpen ? 'Close' : 'Open'}
          </Button>
          <Dropdown
            autofocus
            align="bottom-right"
            anchorEl={button.current}
            open={isOpen}
            width={200}
            style={{ maxHeight: 400 }}>
            <List
              {...dropdownHandlers}
              source={usa_states}
              defaultSelectedIdx={usa_states.indexOf(selectedValue)}
            />
          </Dropdown>
        </div>
      </ComponentAnatomy>
    </>
  );
};

export const ListWithControlledDropdownHook = () => {
  const button = useRef(null);
  const [selectedValue, setSelectedValue] = useState('');
  const [open, setOpen] = useState(false);

  const handleSelection = (e, [idx]) => {
    setSelectedValue(usa_states[idx]);
    requestAnimationFrame(() => {
      button.current.focus();
    });
  };

  const { dropdownHandlers, triggerHandlers, isOpen } = useDropdown({
    open,
    onChange: handleSelection,
    onDropdownChange: setOpen
  });

  return (
    <>
      <div>
        <span style={{ display: 'inline-block', width: 140 }}>{selectedValue}</span>
        <Button {...triggerHandlers} active={isOpen} ref={button} style={{ width: 60 }}>
          {isOpen ? 'Close' : 'Open'}
        </Button>
        <Dropdown
          autofocus
          align="bottom-right"
          anchorEl={button.current}
          open={isOpen}
          width={200}
          style={{ maxHeight: 400 }}>
          <List
            {...dropdownHandlers}
            source={usa_states}
            defaultSelectedIdx={usa_states.indexOf(selectedValue)}
          />
        </Dropdown>
      </div>
    </>
  );
};

export const MultiselectListWithDropdownHook = () => {
  const button = useRef(null);
  const displayText = useRef('');
  const [selectedValues, setSelectedValues] = useState([]);

  const handleSelection = (e, selected) => {
    displayText.current = selected.length > 0 ? usa_states[selected[0]] : '';
    setSelectedValues(selected);
  };

  const handleCancel = () => {
    requestAnimationFrame(() => {
      button.current.focus();
    });
  };

  const { dropdownHandlers, triggerHandlers, isOpen, setIsOpen } = useDropdown({
    closeOnSelect: false,
    onCancel: handleCancel,
    onChange: handleSelection
  });

  const handleCommit = () => {
    setIsOpen(false);
    requestAnimationFrame(() => {
      button.current.focus();
    });
  };

  return (
    <>
      <div>
        <span style={{ display: 'inline-block', width: 140 }}>{displayText.current}</span>
        <Button {...triggerHandlers} active={isOpen} ref={button} style={{ width: 60 }}>
          {isOpen ? 'Close' : 'Open'}
        </Button>
        <Dropdown
          autofocus
          align="bottom-right"
          anchorEl={button.current}
          open={isOpen}
          width={200}
          style={{ maxHeight: 400 }}>
          <List
            {...dropdownHandlers}
            source={usa_states}
            selection="checkbox-only"
            defaultSelectedIndices={selectedValues}
          />
          <div data-footer>
            <Button onClick={handleCommit}>Done</Button>
          </div>
        </Dropdown>
      </div>
    </>
  );
};
