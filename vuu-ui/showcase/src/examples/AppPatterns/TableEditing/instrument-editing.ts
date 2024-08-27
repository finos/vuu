export type Instrument = {
  currency: string;
  description: string;
  exchange: string;
  lotSize: number;
  ric: string;
};

const isObject = (o: unknown) => typeof o === "object" && o !== null;

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
  currency: "",
  exchange: "",
  description: "",
  lotSize: -1,
  ric: "",
};
