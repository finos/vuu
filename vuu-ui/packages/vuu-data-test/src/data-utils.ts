export function random(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomPercentage(value: number) {
  const dec = random(2, 99);
  const percentage = dec / 100;
  return value * percentage;
}
export type PriceGenerator = (min: number, max: number) => number;

export const nextRandomDouble: PriceGenerator = (min, max) =>
  min + (max - min) * Math.random();

export const initBidAsk = (
  priceMaxDelta: number,
  nextRandomDouble: PriceGenerator
) => {
  const mid = nextRandomDouble(0, 1000);
  const tempBid = nextRandomDouble(mid - priceMaxDelta, mid - 1);
  const ask = nextRandomDouble(mid + 1, mid + priceMaxDelta);
  const bid = tempBid < 0 ? mid : tempBid;
  const newBid = Math.round(bid * 100) / 100.0;
  const newAsk = Math.round(ask * 100) / 100.0;
  return [newBid, newAsk];
};

const maxAsk = (
  bid: number,
  ask: number,
  spreadMultipler: number,
  priceMaxDelta: number
) => {
  const spread = ask - bid;
  return Math.min(
    ask + spreadMultipler * spread,
    spread / 2 + bid + priceMaxDelta
  );
};

const minAsk = (
  bid: number,
  ask: number,
  spreadMultipler: number,
  priceMaxDelta: number
) => {
  return Math.max(bid + 1, (ask - bid) / 2 + bid);
};

const maxBid = (
  bid: number,
  ask: number,
  spreadMultipler: number,
  priceMaxDelta: number
) => {
  const result = Math.min(ask - 1, (ask - bid) / 2 + bid);
  return result < 1 ? bid + 1 : result;
};

const minBid = (
  bid: number,
  ask: number,
  spreadMultipler: number,
  priceMaxDelta: number
) => {
  const spread = ask - bid;
  const mid = spread / 2 + bid;
  const result = Math.max(
    bid - Math.min(spreadMultipler * spread, 10),
    mid - priceMaxDelta
  );
  return result < 0 ? bid : result;
};

export const generateNextBidAsk = (
  bid: number,
  ask: number,
  spreadMultipler: number,
  priceMaxDelta: number,
  nextRandomDouble: PriceGenerator
) => {
  let tempAsk = ask;
  if (Math.abs(bid - ask) <= 1) tempAsk = ask + 1;
  const minBidValue = minBid(bid, tempAsk, spreadMultipler, priceMaxDelta);
  const maxBidValue = maxBid(bid, tempAsk, spreadMultipler, priceMaxDelta);
  const minAskValue = minAsk(bid, tempAsk, spreadMultipler, priceMaxDelta);
  const maxAskValue = maxAsk(bid, tempAsk, spreadMultipler, priceMaxDelta);
  const newBid =
    Math.round(nextRandomDouble(minBidValue, maxBidValue) * 100) / 100.0;
  const newAsk =
    Math.round(nextRandomDouble(minAskValue, maxAskValue) * 100) / 100.0;
  return [newBid, newAsk];
};
