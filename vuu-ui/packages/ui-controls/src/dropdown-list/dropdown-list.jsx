import React, { useCallback, useRef } from 'react';
import { Button } from '../button';
import { Dropdown, useDropdown } from '../dropdown';
import { List } from '../list';
import { useId } from '@vuu-ui/react-utils';
import { useItemsWithIds, SINGLE } from '../common-hooks';

const classBase = 'hwDropdownList';

const isMultiSelect = (selection) => selection.startsWith('checkbox');

export const DropdownList = ({
  id: idProp,
  onCommit,
  selection = SINGLE,
  source,
  showButtonbar = isMultiSelect(selection)
}) => {
  const id = useId(idProp);

  const buttonRef = useRef(null);
  const displayText = useRef('');
  const selectedItems = useRef([]);

  const [, sourceWithIds, sourceItemById] = useItemsWithIds(source, id, {
    label: 'DropdownList'
  });

  const handleCancel = () => {
    requestAnimationFrame(() => {
      buttonRef.current.focus();
    });
  };

  const { dropdownHandlers, triggerHandlers, isOpen, setIsOpen } = useDropdown({
    closeOnSelect: false,
    onCancel: handleCancel
  });

  const handleCommit = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => {
      buttonRef.current.focus();
      onCommit?.(selectedItems.current.map(sourceItemById));
    });
  }, [onCommit, setIsOpen, sourceItemById]);

  const handleSelection = (e, selected) => {
    displayText.current = selected.length > 0 ? sourceItemById(selected[0]) : '';
    selectedItems.current = selected;
    if (selection === 'single') {
      handleCommit();
    }
  };

  return (
    <div className={classBase}>
      <span style={{ display: 'inline-block', width: 140 }}>{displayText.current}</span>
      <Button {...triggerHandlers} active={isOpen} ref={buttonRef} style={{ width: 60 }}>
        {isOpen ? 'Close' : 'Open'}
      </Button>
      <Dropdown
        autofocus
        align="bottom-right"
        anchorEl={buttonRef.current}
        open={isOpen}
        width={200}
        style={{ maxHeight: 400 }}>
        <List
          {...dropdownHandlers}
          onChange={handleSelection}
          source={sourceWithIds}
          selection={selection}
        />
        {showButtonbar === true && (
          <div data-footer>
            <Button onClick={handleCommit}>Done</Button>
          </div>
        )}
      </Dropdown>
    </div>
  );
};
