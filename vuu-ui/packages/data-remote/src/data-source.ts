import { VuuTable } from '@vuu-ui/data-types';

export interface DataSourceProps {
  bufferSize?: number;
  aggregations: any;
  columns: any;
  filter: any;
  filterQuery: any;
  group: any;
  sort: any;
  configUrl: any;
  serverName: any;
  serverUrl: any;
  table: VuuTable;
  viewport: any;
  'visual-link': any;
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

export type SubscribeCallback = (...args: any[]) => void;

export interface DataSource {
  setRange: (from: number, to: number) => void;
  subscribe: (props: SubscribeProps, callback: SubscribeCallback) => Promise<any>;
}
