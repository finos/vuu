export namespace SIMUL {
  export interface Instrument {
    bbg: string;
    currency: string;
    description: string;
    exchange: string;
    lotSize: number;
    price: number;
    ric: string;
    vuuCreatedTimestamp: number;
    vuuUpdatedTimestamp: number;
  }
  export declare type InstrumentColumn = keyof Instrument;
}
