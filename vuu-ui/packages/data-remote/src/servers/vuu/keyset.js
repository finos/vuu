export class KeySet {
  constructor(range) {
    this.keys = new Map();
    this.free = [];
    this.nextKeyValue = 0;
    if (range) {
      const { lo, hi, from = lo, to = hi } = range;
      this.reset({ from, to });
    }
  }

  next() {
    if (this.free.length) {
      return this.free.pop();
    } else {
      return this.nextKeyValue++;
    }
  }

  reset({ from, to }) {
    this.keys.forEach((keyValue, rowIndex) => {
      if (rowIndex < from || rowIndex >= to) {
        this.free.push(keyValue);
        this.keys.delete(rowIndex);
      }
    });

    const size = to - from;
    if (this.keys.size + this.free.length > size) {
      this.free.length = size - this.keys.size;
    }

    for (let rowIndex = from; rowIndex < to; rowIndex++) {
      if (!this.keys.has(rowIndex)) {
        const nextKeyValue = this.next();
        this.keys.set(rowIndex, nextKeyValue);
      }
    }
  }

  keyFor(rowIndex) {
    return this.keys.get(rowIndex);
  }
}
