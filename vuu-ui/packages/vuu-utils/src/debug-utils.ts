import { VuuRange } from "@finos/vuu-protocol-types";
import { logger } from "./logging-utils";

const { debug, debugEnabled } = logger("range-monitor");

export class RangeMonitor {
  public range: VuuRange = { from: 0, to: 0 };
  public timestamp = 0;

  constructor(private source: string) {}

  isSet() {
    return this.timestamp !== 0;
  }
  set({ from, to }: VuuRange) {
    const { timestamp } = this;
    this.range.from = from;
    this.range.to = to;
    this.timestamp = performance.now();
    if (timestamp) {
      debugEnabled &&
        debug(
          `<${this.source}> [${from}-${to}], ${(
            this.timestamp - timestamp
          ).toFixed(0)} ms elapsed`
        );
    } else {
      return 0;
    }
  }
}
