import React, { useCallback, useState } from 'react';
// import { TerraceAlignment } from "../components/alignment-tools/terrace-with-alignment";

import '@vuu-ui/theme';

import { LayoutConfigurator } from '@vuu-ui/layout';
import { Brown, Red } from './sample-components';

export default {
  title: 'Layout/Tools',
  component: LayoutConfigurator
};

export const SingleChild = () => {
  const [style, setStyle] = useState({
    width: 600,
    height: 300,
    flexDirection: 'row',
    border: '2px solid black',
    margin: 3,
    padding: 12,
    backgroundColor: '#ccc'
  });

  const handleChange = useCallback((property, value) => {
    console.log(`change ${property} -> ${value}`);
    setStyle((currentStyle) => ({
      ...currentStyle,
      [property]: value
    }));
  }, []);

  console.log(`%cstyle=${JSON.stringify(style, null, 2)}`, 'color:blue;font-weight: bold;');

  return (
    <div>
      <LayoutConfigurator height={300} managedStyle={style} width={400} onChange={handleChange} />
    </div>
  );
};
