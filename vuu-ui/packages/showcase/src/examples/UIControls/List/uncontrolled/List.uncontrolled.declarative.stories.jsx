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
