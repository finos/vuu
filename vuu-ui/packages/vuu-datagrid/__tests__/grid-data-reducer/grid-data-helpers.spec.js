import {
  bufferMinMax,
  getFreedKeys,
  getFullBufferSize,
  getNewEntriesIntoRange
} from '../../grid-data-helpers';

describe('getFreedKeys', () => {
  test('same sets', () => {
    const freedKeys = getFreedKeys({ lo: 10, hi: 20 }, { lo: 10, hi: 20 });
    expect(freedKeys).toEqual([]);
  });

  test('set moved forwards x 1', () => {
    const freedKeys = getFreedKeys({ lo: 10, hi: 20 }, { lo: 11, hi: 21 });
    expect(freedKeys).toEqual([10]);
  });

  test('set moved forwards x 5', () => {
    const freedKeys = getFreedKeys({ lo: 10, hi: 20 }, { lo: 15, hi: 25 });
    expect(freedKeys).toEqual([10, 11, 12, 13, 14]);
  });

  test('set moved backwards x 1', () => {
    const freedKeys = getFreedKeys({ lo: 10, hi: 20 }, { lo: 9, hi: 19 });
    expect(freedKeys).toEqual([19]);
  });

  test('set moved backwards x 7', () => {
    const freedKeys = getFreedKeys({ lo: 10, hi: 20 }, { lo: 3, hi: 13 });
    expect(freedKeys).toEqual([13, 14, 15, 16, 17, 18, 19]);
  });

  test('set moved backwards out of range', () => {
    const freedKeys = getFreedKeys({ lo: 10, hi: 20 }, { lo: 0, hi: 10 });
    expect(freedKeys).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  test('set moved completely out of buffer', () => {
    const freedKeys = getFreedKeys({ lo: 30, hi: 40 }, { lo: 0, hi: 0 });
    expect(freedKeys).toEqual([30, 31, 32, 33, 34, 35, 36, 37, 38, 39]);
  });
});

describe('getNewEntriesIntoRange', () => {
  test('same sets', () => {
    const newEntries = getNewEntriesIntoRange({ lo: 10, hi: 20 }, { lo: 10, hi: 20 });
    expect(newEntries).toEqual([]);
  });

  test('set moved forwards x 1', () => {
    const newEntries = getNewEntriesIntoRange({ lo: 10, hi: 20 }, { lo: 11, hi: 21 });
    expect(newEntries).toEqual([20]);
  });

  test('set moved forwards x 5', () => {
    const newEntries = getNewEntriesIntoRange({ lo: 10, hi: 20 }, { lo: 15, hi: 25 });
    expect(newEntries).toEqual([20, 21, 22, 23, 24]);
  });

  test('set moved backwards x 1', () => {
    const newEntries = getNewEntriesIntoRange({ lo: 10, hi: 20 }, { lo: 9, hi: 19 });
    expect(newEntries).toEqual([9]);
  });

  test('set moved backwards x 7', () => {
    const newEntries = getNewEntriesIntoRange({ lo: 10, hi: 20 }, { lo: 3, hi: 13 });
    expect(newEntries).toEqual([3, 4, 5, 6, 7, 8, 9]);
  });

  test('set moved backwards out of range', () => {
    const newEntries = getNewEntriesIntoRange({ lo: 10, hi: 20 }, { lo: 0, hi: 10 });
    expect(newEntries).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test('set moved completely out of buffer', () => {
    const newEntries = getNewEntriesIntoRange({ lo: 30, hi: 40 }, { lo: 0, hi: 0 });
    expect(newEntries).toEqual([]);
  });
});

describe('getFullBufferSize', () => {
  test('beginning of dataset', () => {
    const bufferSize = getFullBufferSize({ lo: 0, hi: 10 }, 100, 10);
    expect(bufferSize).toEqual(20);
  });

  test('near beginning of dataset', () => {
    const bufferSize = getFullBufferSize({ lo: 4, hi: 14 }, 100, 10);
    expect(bufferSize).toEqual(24);
  });

  test('middle of dataset', () => {
    const bufferSize = getFullBufferSize({ lo: 14, hi: 24 }, 100, 10);
    expect(bufferSize).toEqual(30);
  });

  test('near end of dataset', () => {
    const bufferSize = getFullBufferSize({ lo: 85, hi: 95 }, 100, 10);
    expect(bufferSize).toEqual(25);
  });

  test('end of dataset', () => {
    const bufferSize = getFullBufferSize({ lo: 90, hi: 100 }, 100, 10);
    expect(bufferSize).toEqual(20);
  });
});

describe('bufferMinMax', () => {
  test('1', () => {
    const [min, max] = bufferMinMax({ lo: 280, hi: 300 }, 1247, 100);

    expect(min).toBe(180);
    expect(max).toBe(400);
  });
});
