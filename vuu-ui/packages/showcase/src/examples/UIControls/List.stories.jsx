import React, { useMemo, useState } from 'react';
import { ComponentAnatomy } from '@heswell/component-anatomy';
import {
  Button,
  List,
  ListItem,
  ListItemGroup,
  ListItemHeader,
  VirtualizedList
} from '@vuu-ui/ui-controls';
import { usa_states, usa_states_cities, groupByInitialLetter, random_1000 } from './List.data';

import '@vuu-ui/theme/index.css';

let displaySequence = 1;

export default {
  title: 'UI Controls/List',
  component: List
};

const fullWidthHeight = {
  backgroundColor: 'inherit',
  height: '100%',
  width: '100%'
};

export const SimpleList = () => {
  return (
    <div
      style={{
        ...fullWidthHeight
      }}>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List source={usa_states} />
      </div>
      {/* <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <VirtualizedList source={usa_states} />
      </div> */}
      <input type="text" />
    </div>
  );
};

SimpleList.displaySequence = displaySequence++;

export const SimpleListDragDrop = () => {
  return (
    <div
      style={{
        ...fullWidthHeight
      }}>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List allowDragDrop source={usa_states} />
      </div>
      {/* <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <VirtualizedList source={usa_states} />
      </div> */}
      <input type="text" />
    </div>
  );
};

SimpleListDragDrop.displaySequence = displaySequence++;

export const LargeListDragDrop = () => {
  return (
    <div
      style={{
        ...fullWidthHeight
      }}>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List allowDragDrop source={random_1000} />
      </div>
      <input type="text" />
    </div>
  );
};

LargeListDragDrop.displaySequence = displaySequence++;

export const SimpleListDefaultHighlight = () => {
  return (
    <div
      style={{
        ...fullWidthHeight
      }}>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List defaultHighlightedIdx={3} source={usa_states} />
      </div>
      <input type="text" />
    </div>
  );
};
SimpleListDefaultHighlight.displaySequence = displaySequence++;

export const SimpleListDefaultSelection = () => {
  return (
    <div
      style={{
        ...fullWidthHeight
      }}>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List defaultSelected={['California']} source={usa_states} />
      </div>
      <input type="text" />
    </div>
  );
};
SimpleListDefaultSelection.displaySequence = displaySequence++;

export const SimpleListWithHeaders = () => {
  const wrapperStyle = {
    fontFamily: 'Roboto',
    width: 150,
    height: 400,
    maxHeight: 400,
    position: 'relative',
    border: 'solid 1px #ccc'
  };
  return (
    <div
      style={{
        ...fullWidthHeight,
        display: 'flex',
        gap: 50,
        alignItems: 'flex-start'
      }}>
      <input type="text" />
      <div style={wrapperStyle}>
        <List source={groupByInitialLetter(usa_states, 'headers-only')} />
      </div>
      <div style={wrapperStyle}>
        <List collapsibleHeaders source={groupByInitialLetter(usa_states, 'headers-only')} />
      </div>
      <div style={wrapperStyle}>
        <List
          collapsibleHeaders
          selection="none"
          source={groupByInitialLetter(usa_states, 'headers-only')}
        />
      </div>
      <input type="text" />
    </div>
  );
};

export const SimpleListWithStickyHeaders = () => {
  return (
    <div
      style={{
        ...fullWidthHeight,
        display: 'flex',
        gap: 50,
        alignItems: 'flex-start'
      }}>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List source={groupByInitialLetter(usa_states, 'headers-only')} stickyHeaders />
      </div>
      <input type="text" />
    </div>
  );
};

export const SimpleListWithGroups = () => {
  return (
    <div style={{ width: 900, height: 900, display: 'flex', gap: 50, alignItems: 'flex-start' }}>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <ComponentAnatomy>
          <List
            collapsibleHeaders
            source={groupByInitialLetter(usa_states, 'groups-only')}
            style={{ maxHeight: 500 }}
          />
        </ComponentAnatomy>
      </div>
      <input type="text" />
    </div>
  );
};

export const SimpleListWithNestedGroups = () => {
  return (
    <div style={{ width: 900, height: 900, display: 'flex', gap: 50, alignItems: 'flex-start' }}>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <ComponentAnatomy>
          <List
            collapsibleHeaders
            source={groupByInitialLetter(usa_states_cities, 'groups-only')}
            style={{ maxHeight: 500 }}
          />
        </ComponentAnatomy>
      </div>
      <input type="text" />
    </div>
  );
};

export const MultiSelectList = () => {
  return (
    <div style={{ width: 900, height: 900, display: 'flex', gap: 50, alignItems: 'flex-start' }}>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 200,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List selection="multi" source={usa_states} />
      </div>
      <div
        style={{
          fontFamily: 'Roboto',
          width: 200,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <VirtualizedList selection="multi" source={usa_states} />
      </div>
      <input type="text" />
    </div>
  );
};

export const CheckboxSelectList = () => {
  return (
    <div style={{ width: 900, height: 900, display: 'flex', gap: 50, alignItems: 'flex-start' }}>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 250,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List selection="checkbox" source={usa_states} />
      </div>
      <div
        style={{
          fontFamily: 'Roboto',
          width: 250,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <VirtualizedList selection="checkbox" source={usa_states} />
      </div>
      <input type="text" />
    </div>
  );
};

export const CheckboxOnlySelectList = () => {
  const [selectedValue, setSelectedValue] = useState('');
  return (
    <>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 300,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List
          onChange={(value) => setSelectedValue(value)}
          selection="checkbox-only"
          source={usa_states}
        />
      </div>
      <input type="text" />
      <div>{usa_states[selectedValue]}</div>
    </>
  );
};

export const ExtendedSelectList = () => {
  const [selectedValue, setSelectedValue] = useState('');
  return (
    <div
      style={{
        ...fullWidthHeight,
        display: 'flex',
        gap: 50,
        alignItems: 'flex-start'
      }}>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 300,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List
          onChange={(value) => setSelectedValue(value)}
          selection="extended"
          source={usa_states}
        />
      </div>
      <input type="text" />
      <div>{usa_states[selectedValue]}</div>
    </div>
  );
};

export const ControlledList = () => {
  const [selected, setSelected] = useState([]);
  const [hilitedIdx, setHilitedIdx] = useState(-1);

  const handleChangeController = (evt, newSelected) => {
    console.log(`handleChangeController`);
    setSelected(newSelected);
  };
  const handleChangeControlled = (idx) => {
    console.log(`handleChangeControlled`);
    console.log(`controlled clicked ${idx}`);
  };

  return (
    <div style={{ display: 'flex', height: 600 }}>
      <div>
        <input type="text" />
        <List
          id="controller"
          source={usa_states}
          onChange={handleChangeController}
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
          source={usa_states}
          onChange={handleChangeControlled}
        />
        <input type="text" />
      </div>
    </div>
  );
};

export const FullyControlledList = () => {
  const [selected, setSelected] = useState([]);
  const [hilitedIdx, setHilitedIdx] = useState(-1);

  const handleChangeController = (evt, newSelected) => {
    console.log(`handleChangeController`);
    setSelected(newSelected);
  };
  const handleChangeControlled = (idx) => {
    console.log(`handleChangeControlled`);
    console.log(`controlled clicked ${idx}`);
  };

  const moveUp = () => {
    setHilitedIdx((val) => Math.max(0, val - 1));
  };

  const selectCurrent = () => {
    const [selectedIdx] = selected;
    const newSelection = selectedIdx === hilitedIdx || hilitedIdx === -1 ? [] : [hilitedIdx];
    setSelected(newSelection);
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
          source={usa_states}
          onChange={handleChangeControlled}
        />
      </div>
    </div>
  );
};

export const VirtualizedExample = () => {
  const data = useMemo(() => {
    const data = [];
    for (let i = 0; i < 1000; i++) {
      data.push(`Item ${i + 1}`);
    }
    return data;
  }, []);

  const style = {
    '--hwList-max-height': '300px',
    boxSizing: 'content-box',
    width: 200
  };

  return (
    <div style={style}>
      <input type="text" />
      <VirtualizedList source={data} />
      <input type="text" />
    </div>
  );
};

export const DeclarativeList = () => {
  const [selectedValue, setSelectedValue] = useState('');
  console.log(`render example`);
  return (
    <>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List onChange={(value) => setSelectedValue(value)}>
          <ListItem>Value 1</ListItem>
          <ListItem>Value 2</ListItem>
          <ListItem>Value 3</ListItem>
          <ListItem>Value 4</ListItem>
        </List>
      </div>
      <input type="text" />
      <div>{usa_states[selectedValue]}</div>
    </>
  );
};

export const DeclarativeListUsingDivs = () => {
  const [selectedValue, setSelectedValue] = useState('');
  console.log(`render example`);
  return (
    <>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List onChange={(value) => setSelectedValue(value)}>
          <div>
            <span>Value 1</span>
          </div>
          <div>
            <span>Value 2</span>
          </div>
          <div>Value 3</div>
          <div>Value 4</div>
        </List>
      </div>
      <input type="text" />
      <div>{usa_states[selectedValue]}</div>
    </>
  );
};

export const DeclarativeListWithHeadersUsingDivs = () => {
  const [selectedValue, setSelectedValue] = useState('');
  console.log(`render example`);
  return (
    <>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List onChange={(value) => setSelectedValue(value)} collapsibleHeaders>
          <div data-header label="Group 1" />
          <div>
            <span>Value 1</span>
          </div>
          <div>
            <span>Value 2</span>
          </div>
          <div data-header>Group 2</div>
          <div>Value 3</div>
          <div>Value 4</div>
        </List>
      </div>
      <input type="text" />
      <div>{usa_states[selectedValue]}</div>
    </>
  );
};

export const DeclarativeListWithGroups = () => {
  const [selectedValue, setSelectedValue] = useState('');
  console.log(`render example`);
  return (
    <>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List onChange={(value) => setSelectedValue(value)} collapsibleHeaders stickyHeaders>
          <ListItemGroup title="Group 1">
            <ListItem>Value 1.1</ListItem>
            <ListItem>Value 1.2</ListItem>
            <ListItem>Value 1.3</ListItem>
            <ListItem>Value 1.4</ListItem>
          </ListItemGroup>
          <ListItemGroup title="Group 2">
            <ListItem>Value 2.1</ListItem>
            <ListItem>Value 2.2</ListItem>
            <ListItem>Value 2.3</ListItem>
            <ListItem>Value 2.4</ListItem>
          </ListItemGroup>
          <ListItemGroup title="Group 3">
            <ListItem>Value 3.1</ListItem>
            <ListItem>Value 3.2</ListItem>
            <ListItem>Value 3.3</ListItem>
            <ListItem>Value 3.4</ListItem>
          </ListItemGroup>
          <ListItemGroup title="Group 4">
            <ListItem>Value 4.1</ListItem>
            <ListItem>Value 4.2</ListItem>
            <ListItem>Value 4.3</ListItem>
            <ListItem>Value 4.4</ListItem>
            <ListItem>Value 4.5</ListItem>
            <ListItem>Value 4.6</ListItem>
            <ListItem>Value 4.7</ListItem>
          </ListItemGroup>
          <ListItemGroup title="Group 5">
            <ListItem>Value 5.1</ListItem>
            <ListItem>Value 5.2</ListItem>
            <ListItem>Value 5.3</ListItem>
            <ListItem>Value 5.4</ListItem>
          </ListItemGroup>
        </List>
      </div>
      <input type="text" />
      <div>{usa_states[selectedValue]}</div>
    </>
  );
};

export const DeclarativeListWithNestedGroups = () => {
  const [selectedValue, setSelectedValue] = useState('');
  console.log(`render example`);
  return (
    <>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List onChange={(value) => setSelectedValue(value)} collapsibleHeaders stickyHeaders>
          <ListItemGroup title="Group 1">
            <ListItem>Value 1.1</ListItem>
            <ListItem>Value 1.2</ListItem>
            <ListItem>Value 1.3</ListItem>
            <ListItem>Value 1.4</ListItem>
          </ListItemGroup>
          <ListItemGroup title="Group 2">
            <ListItemGroup title="Group 2.1">
              <ListItem>Value 2.1.1</ListItem>
              <ListItem>Value 2.1.2</ListItem>
              <ListItem>Value 2.1.3</ListItem>
              <ListItem>Value 2.1.4</ListItem>
            </ListItemGroup>
            <ListItem>Value 2.2</ListItem>
            <ListItem>Value 2.3</ListItem>
            <ListItem>Value 2.4</ListItem>
          </ListItemGroup>
          <ListItemGroup title="Group 3">
            <ListItem>Value 3.1</ListItem>
            <ListItem>Value 3.2</ListItem>
            <ListItem>Value 3.3</ListItem>
            <ListItem>Value 3.4</ListItem>
          </ListItemGroup>
          <ListItemGroup title="Group 4">
            <ListItem>Value 4.1</ListItem>
            <ListItem>Value 4.2</ListItem>
            <ListItem>Value 4.3</ListItem>
            <ListItem>Value 4.4</ListItem>
            <ListItem>Value 4.5</ListItem>
            <ListItem>Value 4.6</ListItem>
            <ListItem>Value 4.7</ListItem>
          </ListItemGroup>
          <ListItemGroup title="Group 5">
            <ListItem>Value 5.1</ListItem>
            <ListItem>Value 5.2</ListItem>
            <ListItem>Value 5.3</ListItem>
            <ListItem>Value 5.4</ListItem>
          </ListItemGroup>
        </List>
      </div>
      <input type="text" />
      <div>{usa_states[selectedValue]}</div>
    </>
  );
};

export const DeclarativeListWithHeaders = () => {
  const [selectedValue, setSelectedValue] = useState('');
  console.log(`render example`);
  return (
    <>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List stickyHeaders collapsibleHeaders onChange={(value) => setSelectedValue(value)}>
          <ListItemHeader id="1">Group 1</ListItemHeader>
          <ListItem>Value 1.1</ListItem>
          <ListItem>Value 1.2</ListItem>
          <ListItem>Value 1.3</ListItem>
          <ListItem>Value 1.4</ListItem>
          <ListItemHeader id="2">Group 2</ListItemHeader>
          <ListItem>Value 2.1</ListItem>
          <ListItem>Value 2.2</ListItem>
          <ListItem>Value 2.3</ListItem>
          <ListItem>Value 2.4</ListItem>
          <ListItemHeader id="3">Group 3</ListItemHeader>
          <ListItem>Value 3.1</ListItem>
          <ListItem>Value 3.2</ListItem>
          <ListItem>Value 3.3</ListItem>
          <ListItem>Value 3.4</ListItem>
        </List>
      </div>
      <input type="text" />
      <div>{usa_states[selectedValue]}</div>
    </>
  );
};

export const SimpleListDelayedContent = () => {
  const [source, setSource] = useState([]);

  const loadSource = () => {
    console.log('load source');
    setSource(usa_states);
  };

  return (
    <div
      style={{
        alignItems: 'flex-start',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        ...fullWidthHeight
      }}>
      <Button onClick={loadSource}>Load States</Button>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <List source={source} />
      </div>
      <input type="text" />
    </div>
  );
};
