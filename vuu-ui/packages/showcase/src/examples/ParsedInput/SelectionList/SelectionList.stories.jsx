import React, { useRef, useState } from 'react';
import { SuggestionList } from '@vuu-ui/parsed-input';
import { Button, useItemsWithIds, sourceItems } from '@vuu-ui/ui-controls';

import { ComponentAnatomy } from '@heswell/component-anatomy';
import { useId } from '@vuu-ui/react-utils';

const currencies = [
  { value: 'EUR' },
  { value: 'GBP' },
  { value: 'JPY' },
  { value: 'SEK' },
  { value: 'USD' }
];

export const DefaultSuggestionList = () => {
  const [highlighted, setHighlighted] = useState(0);
  const [selected, setSelected] = useState([]);
  const id = useId();
  const [, sourceWithIds] = useItemsWithIds(currencies, id);

  const handleChange = (evt, newSelected) => {
    setSelected(newSelected.map((item) => item.id));
  };

  return (
    <ComponentAnatomy>
      <SuggestionList
        highlightedIdx={highlighted}
        onChange={handleChange}
        onHighlight={setHighlighted}
        selected={selected}
        selectionStrategy="checkbox-only"
        source={sourceWithIds}
      />
    </ComponentAnatomy>
  );
};

const columns = ['bbg', 'ccy', 'exchange', 'price', 'quantity', 'status', 'timestamp'];
const operators = ['=', 'in', 'starts'];

export const DynamicSuggestionList = () => {
  const [highlighted, setHighlighted] = useState(0);
  const [selected, setSelected] = useState([]);
  const [source, setSource] = useState([]);
  const id = useId();
  const [, sourceWithIds] = useItemsWithIds(source, id);
  const selectionStrategy = useRef('single');
  const suggestionType = useRef();

  const handleChange = (evt, newSelected) => {
    const [lastSelected] = newSelected.slice(-1);
    if (lastSelected && lastSelected.id === 'end-of-list') {
      selectionStrategy.current = 'single';
      suggestionType.current = 'columns';
      setSource(sourceItems(columns));
      setSelected([]);
    } else if (suggestionType.current === 'columns') {
      setSource(sourceItems(operators));
      suggestionType.current = 'operators';
    } else if (suggestionType.current === 'operators') {
      setSource(currencies);
      suggestionType.current = 'currencies';
      const [selectedItem] = newSelected;
      if (selectedItem.label === 'in') {
        selectionStrategy.current = 'checkbox-only';
      }
    } else if (selectionStrategy.current === 'checkbox-only') {
      setSelected(newSelected.map((item) => item.id));
    }
  };

  const clickColumns = () => {
    setSource(sourceItems(columns));
    suggestionType.current = 'columns';
  };

  return (
    <>
      <div style={{ height: 32, marginBottom: 12 }}>
        <Button onClick={clickColumns}>Columns</Button>
      </div>
      <SuggestionList
        highlightedIdx={highlighted}
        onChange={handleChange}
        onHighlight={setHighlighted}
        selected={selected}
        selectionStrategy={selectionStrategy.current}
        source={sourceWithIds}
      />
    </>
  );
};
