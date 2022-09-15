import React from 'react';
import { Flexbox, View } from '@vuu-ui/layout';
import { Button } from '@vuu-ui/ui-controls';
import { useForceRender } from './use-force-render';

const SimpleContent = ({ children }) => {
  return <div className="SimpleComponent">{children}</div>;
};

export const SimpleComponent = () => {
  const forceRender = useForceRender();

  return (
    <Flexbox id="fb-simple-component" style={{ flexDirection: 'row' }}>
      <View id="vw-steve-1" style={{ flex: 1, backgroundColor: 'yellow' }} resizeable>
        <SimpleContent id="sc-1">
          <Button onClick={forceRender}>Render</Button>
        </SimpleContent>
      </View>
      <View id="vw-steve-2" style={{ flex: 1, backgroundColor: 'cyan' }} resizeable>
        <SimpleContent id="sc-2" />
      </View>
    </Flexbox>
  );
};
