import { List, VirtualizedList } from '@heswell/uitk-lab';
import { useCallback, useEffect, useState } from 'react';
import { usa_states } from './List.data';

export const DefaultList = () => {
  return <List aria-label="Listbox example" maxWidth={292} source={usa_states} />;
};

export const DefaultVirtualisedList = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setData(usa_states);
    }, 1000);
  }, []);

  const handleSelect = useCallback((evt, item) => {
    console.log('select', {
      item
    });
  }, []);

  return (
    <VirtualizedList
      aria-label="Listbox example"
      maxWidth={292}
      onSelect={handleSelect}
      source={data}
    />
  );
};
