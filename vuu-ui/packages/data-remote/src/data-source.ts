export interface DataSourceProps {
  bufferSize?: number;
  tableName: string;
  aggregations: any;
  columns: any;
  filter: any;
  filterQuery: any;
  group: any;
  sort: any;
  configUrl: any;
  serverName: any;
  serverUrl: any;
  viewport: any;
  'visual-link': any;
}

export interface SubscribeProps {
  viewport?: string;
  tableName?: string;
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
