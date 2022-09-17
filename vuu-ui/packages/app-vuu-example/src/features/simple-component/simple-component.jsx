import React, { useEffect } from 'react';
import { useId } from '@vuu-ui/react-utils';
import { Flexbox, View } from '@vuu-ui/layout';
import { useViewserver } from '@vuu-ui/data-remote';

const SimpleContent = ({ id }) => {
  useEffect(() => {
    console.log(`%cSimpleContent ${id} MOUNTED`, 'color:blue;font-weight:bold;font-size: 16px');
    return () => {
      console.log(
        `%cSimpleContent ${id} UNMOUNTED`,
        'color:brown;font-weight:bold;font-size: 16px'
      );
    };
  }, []);

  return <div className="SimpleComponent"></div>;
};

export const SimpleComponent = ({ id: idProp }) => {
  const id = useId(idProp);
  const { tables } = useViewserver({ label: 'Metrics' });

  useEffect(() => {
    console.log(`%cSimpleComponent ${id} MOUNTED`, 'color:blue;font-weight:bold;font-size: 16px');
    return () => {
      console.log(
        `%cSimpleComponent ${id} UNMOUNTED`,
        'color:brown;font-weight:bold;font-size: 16px'
      );
    };
  }, []);

  return (
    <Flexbox style={{ flexDirection: 'row' }}>
      <View id="vw-steve-1" style={{ flex: 1, backgroundColor: 'yellow' }}>
        <SimpleContent id="sc-1" />
      </View>
      <View id="vw-steve-2" style={{ flex: 1, backgroundColor: 'cyan' }}>
        <SimpleContent id="sc-2" />
      </View>
    </Flexbox>
  );
};
