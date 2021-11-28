import React from 'react';

import { DatePicker } from '@vuu-ui/ui-controls';

const story = {
  title: 'UI Controls/DatePicker',
  component: DatePicker
};

export default story;

export const SimpleDatePicker = () => (
  // <LoggingProvider>
  <>
    <input type="text" defaultValue="start" />
    <div style={{ width: 150, height: 24, position: 'relative', border: 'solid 1px #ccc' }}>
      {/* <LoggingDomain path="date-picker-example"> */}
      <DatePicker data-log-name="trade-date" />
      {/* </LoggingDomain> */}
    </div>
    <input type="text" defaultValue="end" />
  </>
);
// </LoggingProvider>
