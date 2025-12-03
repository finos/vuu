export interface ClockProps {
  year?: number;
  month?: number;
  day?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

export type ClockTimeUnit = "minutes" | "seconds" | "ms";
export class Clock {
  #millisSinceEpoch = 0;
  #showCurrentTime = false;

  constructor(props?: ClockProps) {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    if (props) {
      const dateProvided =
        typeof props.year === "number" &&
        typeof props.month === "number" &&
        typeof props.day === "number";

      const year = props.year ?? today.getFullYear();
      const month =
        props.month !== undefined ? props.month - 1 : today.getMonth();
      const day = props.day ?? today.getDay();

      const hours =
        props.hours !== undefined
          ? offset === 0
            ? props.hours
            : // oversimplified, assumes BST
              props.hours + 1
          : dateProvided
            ? offset
              ? 1 // assumed BST
              : 0
            : today.getUTCHours();
      const minutes = props.minutes ?? (dateProvided ? 0 : today.getMinutes());
      const seconds = props.seconds ?? (dateProvided ? 0 : today.getSeconds());
      const ms =
        props.milliseconds ?? (dateProvided ? 0 : today.getMilliseconds());
      const date = new Date(year, month, day, hours, minutes, seconds, ms);
      this.#millisSinceEpoch = date.getTime();
    } else {
      this.#millisSinceEpoch = today.getTime();
    }
  }

  goBack(value: number, units: ClockTimeUnit = "ms") {
    const multiplier = units === "ms" ? 1 : units === "seconds" ? 1000 : 60_000;
    this.#millisSinceEpoch -= value * multiplier;
    return this;
  }

  advance(value: number, units: ClockTimeUnit = "ms") {
    const multiplier = units === "ms" ? 1 : units === "seconds" ? 1000 : 60_000;
    this.#millisSinceEpoch += value * multiplier;
    return this;
  }

  set showCurrentTime(value: boolean) {
    this.#showCurrentTime = value;
  }

  toString() {
    return new Date(this.now).toISOString();
  }

  get now() {
    return this.#showCurrentTime
      ? new Date().getTime()
      : this.#millisSinceEpoch;
  }

  get date() {
    return this.#showCurrentTime
      ? new Date()
      : new Date(this.#millisSinceEpoch);
  }
}
