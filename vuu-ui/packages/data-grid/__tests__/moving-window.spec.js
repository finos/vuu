import { MovingWindow } from '../use-data-source';

describe('MovingWindow', () => {
  it.ly('updates data', () => {
    const dataWindow = new MovingWindow({ lo: 3109, hi: 3144 });
    let data = [
      [3109, 13],
      [3110, 11],
      [3111, 8],
      [3112, 15],
      [3113, 20],
      [3114, 6],
      [3115, 16],
      [3116, 14],
      [3118, 30],
      [3119, 19],
      [3120, 28],
      [3121, 12],
      [3122, 5],
      [3123, 29],
      [3124, 31],
      [3125, 18],
      [3126, 1],
      [3127, 27],
      [3128, 2],
      [3129, 10],
      [3130, 7],
      [3131, 25],
      [3132, 33],
      [3133, 17],
      [3134, 22],
      [3135, 26],
      [3136, 4],
      [3137, 32],
      [3138, 3],
      [3139, 9],
      [3140, 21],
      [3341, 24],
      [3142, 34],
      [3143, 0],
      [3144, 23]
    ];
    data.forEach((row) => dataWindow.add(row));
    console.table(dataWindow.data);
    expect(dataWindow.data).toHaveLength(35);

    dataWindow.setRange(3142, 3177);
    data = [
      [3152, 22],
      [3153, 17],
      [3154, 33],
      [3155, 25],
      [3156, 7],
      [3157, 10],
      [3158, 2],
      [3159, 27],
      [3160, 1],
      [3161, 18],
      [3162, 31],
      [3163, 29],
      [3164, 5],
      [3165, 12],
      [3166, 28],
      [3167, 19],
      [3168, 30],
      [3169, 14],
      [3170, 16],
      [3171, 6],
      [3172, 20],
      [3173, 15],
      [3174, 8],
      [3175, 11],
      [3176, 14]
    ];

    data.forEach((row) => dataWindow.add(row));
    console.table(dataWindow.data);
    expect(dataWindow.data).toHaveLength(35);
  });
});
