import React, { createRef, useRef } from 'react';
import { useControlled } from '../utils';

var direction = {
  ArrowLeft: -1,
  ArrowUp: -1,
  ArrowRight: 1,
  ArrowDown: 1,
  Home: 0,
  End: 0
};

// Not safe enough to make this a general purpose hook
const useChildRefs = (children) => {
  const childRefs = useRef([]);
  const childCount = React.Children.count(children);
  if (childRefs.current.length !== childCount) {
    // Do not preserve any of the existing refs. Things get confusing if children are
    // added dynamically and pre-existing refs then point to new content. There are
    // scenarios in which this is difficult to detect.
    childRefs.current = Array(childCount)
      .fill(null)
      .map(() => createRef());
  }
  return childRefs.current;
};

export default function useTabstrip({
  children,
  defaultValue,
  keyBoardActivation = 'manual',
  onChange,
  onDeleteTab,
  orientation,
  value: valueProp
}) {
  const tabs = useChildRefs(children);
  const manualActivation = keyBoardActivation === 'manual';
  const vertical = orientation === 'vertical';

  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'Tabstrip',
    state: 'value'
  });

  function focusTab(tabIndex) {
    const tab = tabs[tabIndex].current;
    // The timeout is very important in one scenario: where tab has overflowed
    // and is being selected from overflow menu. We must not focus it until the
    // overflow mechanism + render has restored it to the main display.
    setTimeout(() => {
      tab.focus();
    }, 70);
  }

  function activateTab(e, tabIndex) {
    setValue(tabIndex);
    onChange && onChange(e, tabIndex);
    focusTab(tabIndex);
  }

  function switchTabOnKeyPress(e, tabIndex) {
    const { key } = e;
    if (direction[key] !== undefined) {
      e.preventDefault();
      let newTabIndex;
      const tab = tabs[tabIndex + direction[key]];
      if (tab && !tab.current.dataset.overflowed) {
        newTabIndex = tabIndex + direction[key];
      } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
        newTabIndex = tabs.length - 1;
        let tab = tabs[newTabIndex].current;
        while (tab.dataset.overflowed && newTabIndex !== tabIndex) {
          newTabIndex -= 1;
          tab = tabs[newTabIndex].current;
        }
      } else if (key === 'ArrowRight' || key === 'ArrowDown') {
        newTabIndex = 0;
      }
      if (manualActivation) {
        focusTab(newTabIndex);
      } else {
        activateTab(e, newTabIndex);
      }
    }
  }

  const handleClick = (e, tabIndex) => {
    if (tabIndex !== value) {
      setValue(tabIndex);
      onChange && onChange(e, tabIndex);
      focusTab(tabIndex);
    }
  };

  const handleKeyDown = (e, tabIndex) => {
    const key = e.key;
    switch (key) {
      case 'End':
        switchTabOnKeyPress(e, tabs.length - 1);
        break;
      case 'Home':
        switchTabOnKeyPress(e, 0);
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        if (!vertical) {
          switchTabOnKeyPress(e, tabIndex);
        }
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        if (vertical) {
          switchTabOnKeyPress(e, tabIndex);
        }
        break;
      default:
    }
  };

  const handleKeyUp = (e, tabIndex) => {
    const key = e.key;
    switch (key) {
      case 'Enter':
      case 'Space':
        if (tabIndex !== value) {
          onChange && onChange(e, tabIndex);
        }
        break;
      default:
    }
  };

  const handleDeleteTab = (e, tabIndex) => {
    onDeleteTab(e, tabIndex);
    if (tabIndex - 1 < 0) {
      focusTab(0);
    } else {
      focusTab(tabIndex - 1);
    }
  };

  return {
    activateTab,
    tabProps: {
      onClick: handleClick,
      onDelete: handleDeleteTab,
      onKeyDown: handleKeyDown,
      onKeyUp: handleKeyUp
    },
    tabRefs: tabs,
    value
  };
}
