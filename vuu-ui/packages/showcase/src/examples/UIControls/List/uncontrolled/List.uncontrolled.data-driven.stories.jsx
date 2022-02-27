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

import { usa_states, usa_states_cities, groupByInitialLetter, random_1000 } from '../List.data';

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
