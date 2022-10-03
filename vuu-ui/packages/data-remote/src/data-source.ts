import { VuuAggregation, VuuFilter, VuuGroupBy, VuuSort, VuuTable } from '@vuu-ui/data-types';
import { VuuUIMessageIn } from './vuuUIMessageTypes';

export interface DataSourceProps {
  bufferSize?: number;
  table: VuuTable;
  aggregations?: VuuAggregation[];
  columns: string[];
  filter?: VuuFilter;
  filterQuery?: any;
  group?: VuuGroupBy;
  sort?: VuuSort;
  configUrl?: any;
  serverUrl: string;
  viewport?: string;
  'visual-link'?: any;
}

export interface SubscribeProps {
  viewport?: string;
  table?: VuuTable;
  columns?: any;
  aggregations?: any;
  range?: any;
  sort?: any;
  groupBy?: any;
  filter?: any;
  filterQuery?: any;
}

export type SubscribeCallback = (message: VuuUIMessageIn) => void;

export interface DataSource {
  setRange: (from: number, to: number) => void;
  subscribe: (props: SubscribeProps, callback: SubscribeCallback) => Promise<any>;
}
