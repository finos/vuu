import React, { useRef, useState } from 'react';
import { SuggestionList } from '@vuu-ui/parsed-input';
import { useItemsWithIds } from '@vuu-ui/ui-controls';

import { ComponentAnatomy } from '@heswell/component-anatomy';
import { useId } from '@vuu-ui/react-utils';

import '@vuu-ui/parsed-input/index.css';

const currencies = [
  { value: 'EUR' },
  { value: 'GBP' },
  { value: 'JPY' },
  { value: 'SEK' },
  { value: 'USD' }
];

const sortSelectedSuggestions = (selected, suggestions) => {
  const selectedValues = selected.map((i) => suggestions[i].value);

  const sortedSuggestions = suggestions.map((suggestion, i) => ({ ...suggestion, i }));

  sortedSuggestions.sort(({ value: v1, i: i1 }, { value: v2, i: i2 }) => {
    const s1 = selected.includes(i1) ? 1 : 0;
    const s2 = selected.includes(i2) ? 1 : 0;

    if (s1 === s2) {
      if (v1 === 'EOF') {
        return -1;
      } else if (v2 === 'EOF') {
        return 0;
      } else if (v1 > v2) {
        return 0;
      } else {
        return -1;
      }
    } else {
      return s2 - s1;
    }
  });

  const sortedSelected = selectedValues.map((v) =>
    sortedSuggestions.findIndex((s) => s.value === v)
  );

  return [sortedSelected, sortedSuggestions];
};

export const DefaultSuggestionList = () => {
  const selectedValues = useRef([]);
  const [highlighted, setHighlighted] = useState(0);
  const [selected, setSelected] = useState([]);
  const [suggestions, setSuggestions] = useState(currencies);

  const id = useId();
  const [totalItemCount, sourceWithIds] = useItemsWithIds(currencies, id, {
    label: 'DefaultSuggestionList'
  });

  console.log({ sourceWithIds });

  const handleChange = (evt, newSelected) => {
    console.log(`handleChange`, newSelected);
    // selectedValues.current = newSelected.map((idx) => suggestions[idx].value);
    // const containsCommit = suggestions.find((s) => s.value === 'EOF');

    // let updatedSelected = newSelected;
    // let updatedSuggestions = suggestions;

    // if (newSelected.length > 0 && !containsCommit) {
    //   updatedSuggestions = [{ value: 'EOF' }].concat(currencies);
    //   updatedSelected = newSelected.map((i) => i + 1);
    // } else if (newSelected.length < 1 && containsCommit) {
    //   updatedSuggestions = currencies;
    //   updatedSelected = newSelected.filter((i) => i > 0).map((i) => i - 1);
    // }

    // [updatedSelected, updatedSuggestions] = sortSelectedSuggestions(
    //   updatedSelected,
    //   updatedSuggestions
    // );

    // setHighlighted(updatedSuggestions.findIndex((s) => s.value === 'EOF'));
    // setSuggestions(updatedSuggestions);
    // setSelected(updatedSelected);
  };

  console.log({ highlighted });
  return (
    <ComponentAnatomy>
      <SuggestionList
        highlightedIdx={highlighted}
        onChange={handleChange}
        onHighlight={setHighlighted}
        selected={selected}
        selectionStrategy="checkbox"
        suggestions={sourceWithIds}
      />
    </ComponentAnatomy>
  );
};
