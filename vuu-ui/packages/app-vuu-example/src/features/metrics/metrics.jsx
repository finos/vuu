import React, { useEffect } from 'react';
import { Flexbox, View } from '@vuu-ui/layout';
import { useViewserver } from '@vuu-ui/data-remote';
import { MetricsTable } from './metrics-table';

import './metrics.css';

export const Metrics = () => {
  const { tables } = useViewserver({ label: 'Metrics' });

  useEffect(() => {
    console.log(`%cMetrics MOUNTED`, 'color:blue;font-weight:bold;font-size: 16px');
    return () => {
      console.log(`%cMetrics UNMOUNTED`, 'color:brown;font-weight:bold;font-size: 16px');
    };
  }, []);

  if (tables.metricsTables) {
    return (
      <Flexbox style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1 }} id="vw-metrics-1">
          <MetricsTable schema={tables.metricsTables} />
        </View>
        <View style={{ flex: 1 }} id="vw-metrics2">
          <MetricsTable schema={tables.metricsViewports} />
        </View>
      </Flexbox>
    );
  } else {
    return null;
  }
};
