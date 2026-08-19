import { createContext, useContext } from "react";
import type { TemplateSource } from "../GridLayoutContext";

export type TemplateDragMetrics = {
  elementHeight: number;
  elementWidth: number;
  labelWidth: number;
  x: number;
  y: number;
};

export class TemplateDragSession {
  #dropped = false;
  #metrics: TemplateDragMetrics | undefined;
  #source: TemplateSource | undefined;

  begin(source: TemplateSource, metrics: TemplateDragMetrics) {
    this.#dropped = false;
    this.#metrics = metrics;
    this.#source = source;
  }

  completeDrop() {
    this.#dropped = true;
  }

  end() {
    this.#metrics = undefined;
    this.#source = undefined;
  }

  get dropped() {
    return this.#dropped;
  }

  get metrics() {
    return this.#metrics;
  }

  get source() {
    return this.#source;
  }

  set x(value: number) {
    if (this.#metrics) {
      this.#metrics.x = value;
    }
  }

  set y(value: number) {
    if (this.#metrics) {
      this.#metrics.y = value;
    }
  }
}

export const TemplateDragSessionContext = createContext<
  TemplateDragSession | undefined
>(undefined);

export const useTemplateDragSession = () =>
  useContext(TemplateDragSessionContext);
