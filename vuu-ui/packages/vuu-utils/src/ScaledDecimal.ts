const scaledDecimals = (fraction: string, decimals: number) => {
  if (fraction.length > decimals) {
    return fraction.slice(0, decimals);
  } else if (fraction.length === decimals) {
    return fraction;
  } else {
    return fraction.padEnd(decimals, "0");
  }
};

export class ScaledDecimal {
  constructor(
    protected readonly value: string,
    private readonly decimals = 6,
  ) {
    console.log(`create a scaled decimal ${value} (${decimals} decimals)`);
  }

  get asLong() {
    if (this.value === "") {
      return "";
    } else {
      const [integral, fraction = "0"] = this.value.split(".");
      return `${integral}${scaledDecimals(fraction, this.decimals)}`;
    }
  }

  toJSON() {
    return this.value;
  }

  toString() {
    return this.value;
  }
}

export const ScaledDecimal2 = (value: string): ScaledDecimal =>
  new ScaledDecimal(value, 2);
export const ScaledDecimal4 = (value: string): ScaledDecimal =>
  new ScaledDecimal(value, 4);
export const ScaledDecimal6 = (value: string): ScaledDecimal =>
  new ScaledDecimal(value, 6);
export const ScaledDecimal8 = (value: string): ScaledDecimal =>
  new ScaledDecimal(value, 8);
