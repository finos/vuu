import { isObject } from "@finos/vuu-utils";

export type Instrument = {
  bbg: string;
  currency: string;
  description: string;
  exchange: string;
  isin: string;
  lotSize: number;
  ric: string;
  price: number;
  date: number;
};

export const isValidInstrument = (o: unknown): o is Instrument => {
  if (!isObject(o)) return false;
  const instrument = o as Instrument;
  return (
    typeof instrument.currency === "string" &&
    typeof instrument.description === "string" &&
    typeof instrument.exchange === "string" &&
    typeof instrument.lotSize === "number" &&
    typeof instrument.ric === "string"
  );
};

export const EmptyInstrument: Instrument = {
  bbg: "",
  currency: "",
  description: "",
  exchange: "",
  isin: "",
  lotSize: -1,
  ric: "",
  price: -1,
  date: -1,
};
