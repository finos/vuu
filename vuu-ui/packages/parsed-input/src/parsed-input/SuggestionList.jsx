import React, { forwardRef } from 'react';
import cx from 'classnames';
import { List } from '@vuu-ui/ui-controls';

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
  {
    className,
    highlightedIdx,
    id,
    onSuggestionClick,
    selected,
    selectionStrategy,
    suggestions,
    ...restProps
  },
  ref
) {
  return (
    <List
      {...restProps}
      className={className}
      highlightedIdx={highlightedIdx}
      id={id}
      onChange={onSuggestionClick}
      ref={ref}
      selection={selectionStrategy}
      selected={selected}>
      {suggestions.length > 0
        ? suggestions.map(({ id, value, displayValue = value, isIllustration }) => (
            <div
              className={cx({
                // [`${classBase}-selected`]: selected.includes(i),
                [`${classBase}-illustration`]: isIllustration,
                [`${classBase}-commit`]: value === 'EOF',
                [`${classBase}-close-list`]: value === ']'
              })}
              id={id}
              key={value}>
              {formatDisplayValue(displayValue)}
            </div>
          ))
        : NO_SUGGESTIONS}
    </List>
  );
});
