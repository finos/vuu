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
