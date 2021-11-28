import React from 'react';
import { FlexboxLayout as Flexbox, Placeholder, View } from '@vuu-ui/layout';

export const twoColumns = (
  <Flexbox style={{ flexDirection: 'column' }}>
    <View closeable header resizeable title="Placeholder 1" style={{ flex: 1 }}>
      <Placeholder data-resizeable style={{ flex: 1 }} />
    </View>
    <Placeholder data-resizeable style={{ flex: 1 }} />
  </Flexbox>
);
