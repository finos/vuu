import React, { useCallback, useState } from 'react';
import { useId } from '@vuu-ui/react-utils';
import { Button, sourceItems, List, useItemsWithIds } from '@vuu-ui/ui-controls';

import { usa_states } from '../List.data';

import '@vuu-ui/theme/index.css';

let displaySequence = 1;

const NO_SELECTION = [];

export const ListControlsList = () => {
  const [selected, setSelected] = useState([]);
  const [hilitedIdx, setHilitedIdx] = useState(-1);

  const id = useId();
  const [, sourceWithIds] = useItemsWithIds(sourceItems(usa_states), id);

  const handleChange = (evt, newSelected) => {
    const selectedIds = newSelected.map((item) => item.id);
    setSelected(selectedIds);
  };

  return (
    <div style={{ display: 'flex', height: 600 }}>
      <div>
        <input type="text" />
        <List
          id="controller"
          source={sourceWithIds}
          onChange={handleChange}
          onHighlight={(idx) => setHilitedIdx(idx)}
        />
        <input type="text" />
      </div>
      <div>
        <input type="text" />
        <List
          id="controlled"
          highlightedIdx={hilitedIdx}
          selected={selected}
          source={sourceWithIds}
        />
        <input type="text" />
      </div>
    </div>
  );
};

ListControlsList.displaySequence = displaySequence++;

export const FullyControlledList = () => {
  const [selected, setSelected] = useState([]);
  const [hilitedIdx, setHilitedIdx] = useState(-1);

  const id = useId();
  const [, sourceWithIds] = useItemsWithIds(sourceItems(usa_states), id);

  const moveUp = () => {
    setHilitedIdx((val) => Math.max(0, val - 1));
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

  const moveDown = () => {
    setHilitedIdx((val) => Math.min(usa_states.length - 1, val + 1));
  };

  return (
    <div style={{ height: 600 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button onClick={moveDown}>Highlight down</Button>
        <Button onClick={moveUp}>Highlight up</Button>
        <Button onClick={selectCurrent}>Select</Button>
      </div>
      <div style={{ height: 600 }}>
        <List
          id="controlled"
          highlightedIdx={hilitedIdx}
          selected={selected}
          source={sourceWithIds}
        />
      </div>
    </div>
  );
};
FullyControlledList.displaySequence = displaySequence++;

export const PartiallyControlledList = () => {
  const [selected, setSelected] = useState([]);
  const [hilitedIdx, setHilitedIdx] = useState(-1);

  const id = useId();
  const [, sourceWithIds] = useItemsWithIds(sourceItems(usa_states), id);

  const moveUp = () => {
    setHilitedIdx((val) => Math.max(0, val - 1));
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

  const moveDown = () => {
    setHilitedIdx((val) => Math.min(usa_states.length - 1, val + 1));
  };

  return (
    <div style={{ height: 600 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button onClick={moveDown}>Highlight down</Button>
        <Button onClick={moveUp}>Highlight up</Button>
        <Button onClick={selectCurrent}>Select</Button>
      </div>
      <div style={{ height: 600 }}>
        <List
          id="controlled"
          highlightedIdx={hilitedIdx}
          onHighlight={handleHighlight}
          selected={selected}
          source={sourceWithIds}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};
PartiallyControlledList.displaySequence = displaySequence++;
