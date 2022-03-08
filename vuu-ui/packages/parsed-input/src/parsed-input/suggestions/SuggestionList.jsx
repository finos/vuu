import React, { forwardRef, useLayoutEffect, useState } from 'react';
import cx from 'classnames';
import { List } from '@vuu-ui/ui-controls';
import { useSuggestionList } from './useSuggestionList';

import './SuggestionList.css';

// for now ...
const classBase = 'hwSelectionList';

const NO_SUGGESTIONS = [];

function formatDisplayValue(displayValue) {
  if (Array.isArray(displayValue)) {
    return displayValue.map((value, i) => (
      <span key={i} className={`${classBase}-listCol`}>
        {value}
      </span>
    ));
  } else if (displayValue === 'EOF') {
    return <div>ENTER to submit filter</div>;
  } else {
    return displayValue;
  }
}

export const SuggestionList = forwardRef(function SuggestionList(
  { className, highlightedIdx, id, onChange, selected, selectionStrategy, source, ...restProps },
  ref
) {
  useSuggestionList({
    selected,
    selectionStrategy,
    // setHighlightedIdx,
    source
  });

  return (
    <List
      {...restProps}
      className={className}
      highlightedIdx={highlightedIdx}
      id={id}
      onChange={onChange}
      ref={ref}
      // onHighlight={setHighlightedIdx}
      selection={selectionStrategy}
      selected={selected}>
      {source.length > 0
        ? source.map(({ id, label, value = label, displayValue = value, isIllustration }) => (
            <div
              className={cx({
                // [`${classBase}-selected`]: selected.includes(i),
                [`${classBase}-illustration`]: isIllustration,
                [`${classBase}-commit`]: value === 'EOF',
                [`${classBase}-close-list`]: value === ']'
              })}
              id={id}
              key={id}>
              {formatDisplayValue(displayValue)}
            </div>
          ))
        : NO_SUGGESTIONS}
    </List>
  );
});
