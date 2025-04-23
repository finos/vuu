import { alphanumeric } from "./fixtures/alphanumeric-values";

export const generateRandomAlphanumeric = (): string | number =>
  alphanumeric[Math.floor(Math.random() * alphanumeric.length)];
