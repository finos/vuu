import React, { useCallback, useMemo, useState } from 'react';
import { useId } from '@vuu-ui/react-utils';
import {
  Button,
  sourceItems,
  Pill,
  Pillbox,
  usePillbox,
  useItemsWithIds
} from '@vuu-ui/ui-controls';
import { usa_states } from '../../List/List.data';

let displaySequence = 1;
const NO_SELECTION = [];

const ten_states = usa_states.slice(0, 10);

export const PartiallyControlledPillbox = () => {
  const [selected, setSelected] = useState([]);
  const [hilitedIdx, setHilitedIdx] = useState(-1);

  const id = useId();
  const [, sourceWithIds] = useItemsWithIds(sourceItems(ten_states), id);

  const moveUp = () => {
    setHilitedIdx((val) => Math.max(0, val - 1));
  };

  const moveDown = () => {
    setHilitedIdx((val) => Math.min(ten_states.length - 1, val + 1));
  };

  const selectCurrent = () => {
    const [selectedId] = selected;
    if (hilitedIdx !== -1) {
      // This works because this list does not allow items to be re=arranged.
      // What the list actually renders, though, is the dataHook.indexPositions
      const { id } = sourceWithIds[hilitedIdx];
      const newSelection = selectedId === id || hilitedIdx === -1 ? [] : [id];
      setSelected(newSelection);
    } else {
      setSelected(NO_SELECTION);
    }
  };

  const handleChange = useCallback(
    (_evt, newSelected) => {
      setSelected(newSelected.map((item) => item.id));
    },
    [setSelected]
  );

  const handleHighlight = useCallback(
    (idx) => {
      setHilitedIdx(idx);
    },
    [setHilitedIdx]
  );

  return (
    <div style={{ height: 600 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button onClick={moveDown}>Highlight down</Button>
        <Button onClick={moveUp}>Highlight up</Button>
        <Button onClick={selectCurrent}>Select</Button>
      </div>
      <div style={{ height: 600 }}>
        <Pillbox
          style={{ margin: 10, backgroundColor: 'white', padding: 10 }}
          highlightedIdx={hilitedIdx}
          onHighlight={handleHighlight}
          selected={selected}
          onChange={handleChange}>
          {sourceWithIds.map((item) => (
            <Pill id={item.id} key={item.id} label={item.label} />
          ))}
        </Pillbox>
      </div>
    </div>
  );
};
PartiallyControlledPillbox.displaySequence = displaySequence++;

export const HookControlledPillbox = () => {
  const id = useId();
  const [, itemsWithIds] = useItemsWithIds(sourceItems(ten_states), id);

  const { controlProps, highlightedIdx, selected, visibleData } = usePillbox({
    id,
    itemsWithIds
  });

  return (
    <div style={{ height: 600 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button {...controlProps}>Controller</Button>
      </div>
      <div style={{ height: 600 }}>
        <Pillbox
          style={{ margin: 10, backgroundColor: 'white', padding: 10 }}
          highlightedIdx={highlightedIdx}
          selected={selected}>
          {visibleData.map((item) => (
            <Pill id={item.id} key={item.id} label={item.label} />
          ))}
        </Pillbox>
      </div>
    </div>
  );
};
HookControlledPillbox.displaySequence = displaySequence++;

export const HookControlledPillboxCloseablePills = () => {
  const id = useId();
  const items = useMemo(() => sourceItems(ten_states, { closeable: true }), []);
  const [, itemsWithIds] = useItemsWithIds(items, id);

  const { controlProps, highlightedIdx, selected, visibleData } = usePillbox({
    id,
    itemsWithIds,
    label: 'PillboxStory'
  });

  console.log(`Piilbox story visibleData ${visibleData.length} items`);
  return (
    <div style={{ height: 600 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button {...controlProps}>Controller</Button>
      </div>
      <div style={{ height: 600 }}>
        <Pillbox
          style={{ margin: 10, backgroundColor: 'white', padding: 10 }}
          highlightedIdx={highlightedIdx}
          selected={selected}>
          {visibleData.map((item) => (
            <Pill closeable={item.closeable} id={item.id} key={item.id} label={item.label} />
          ))}
        </Pillbox>
      </div>
    </div>
  );
};
HookControlledPillboxCloseablePills.displaySequence = displaySequence++;
