import React, { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import cx from 'classnames';
import { extractFilter, filterAsQuery } from '@vuu-ui/datagrid-parsers';
import { addFilter, filterClauses as filterClausesFromFilter } from '@vuu-ui/utils';
import { useId } from '@vuu-ui/react-utils';
import {
  Button,
  Flipper,
  Pillbox,
  Pill,
  sourceItems,
  useItemsWithIds,
  usePillbox
} from '@vuu-ui/ui-controls';
import { ParsedInput } from '../parsed-input';

import './ParsedInputFilter.css';

const classRoot = 'hwParsedInputFilter';

export const ParsedInputFilter = forwardRef(function ParsedInputFilter(
  { className },
  forwardedRef
) {
  const id = useId();

  const input = useRef(null);
  const button = useRef(null);
  const [flipped, setFlipped] = useState(false);
  const [namedFilters, setNamedFilters] = useState([]);
  const [filter, setFilter] = useState();

  const filterClauses = useMemo(
    () => sourceItems(filterClausesFromFilter(filter), { closeable: true }),
    [filter]
  );
  const [, itemsWithIds] = useItemsWithIds(filterClauses, id);

  const handleCommit = (result) => {
    const { filter: f, name } = extractFilter(result);
    const filterQuery = filterAsQuery(f, namedFilters);
    console.log(
      `extracted filter 
      ${JSON.stringify(f)} 
      %c${filterQuery}
      %c${name ? name : ''}
      `,
      'color:blue;font-weight:bold;',
      'color:black'
    );
    setFlipped(false);
    setTimeout(() => {
      button.current.focus();
    }, 100);

    setFilter(addFilter(filter, f, { combineWith: 'and' }));
    if (name) {
      setNamedFilters(namedFilters.concat({ name, f }));
    }
  };

  const handleExpand = useCallback(() => {
    setFlipped((val) => !val);
    if (flipped) {
      setFlipped(false);
      button.current.focus();
    } else {
      setFlipped(true);
      setTimeout(() => {
        input.current.focus();
      }, 500);
    }
  }, [flipped]);

  const handleDelete = useCallback((item) => {
    console.log(`deleted ${item.id} ${item.label}`);
  }, []);

  const { controlProps, highlightedIdx, selected, visibleData } = usePillbox({
    id,
    itemsWithIds,
    label: 'PillboxStory'
  });

  console.log(`ParsedInputFilter selected ${selected.join(',')}`);
  return (
    <div className={cx(classRoot, className)} ref={forwardedRef}>
      <Button
        {...controlProps}
        data-icon="filter"
        onClick={handleExpand}
        ref={button}
        style={{ flex: '0 0 auto' }}></Button>
      <Flipper flipped={flipped}>
        <Pillbox
          highlightedIdx={highlightedIdx}
          onDelete={handleDelete}
          selected={selected}
          style={{ flex: '1 1 auto' }}>
          {visibleData.map((item, i) => (
            <Pill
              id={item.id}
              key={i}
              closeable={item.closeable}
              prefix={item.column}
              label={item.value}
              selected={selected.includes(item.id)}
              orientation="vertical"
            />
          ))}
        </Pillbox>
        <ParsedInput className={`${classRoot}-input`} ref={input} onCommit={handleCommit} />
      </Flipper>
    </div>
  );
});
