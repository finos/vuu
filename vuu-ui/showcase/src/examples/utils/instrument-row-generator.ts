import { RowGenerator } from "./vuu-row-generator";

function random(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const chars = Array.from("ABCDEFGHIJKLMNOPQRST");
const locations = {
  L: ["London PLC", "XLON/LSE-SETS"],
  N: ["Corporation", "XNGS/NAS-GSM"],
  AS: ["B.V.", "XAMS/ENA-MAIN"],
  OQ: ["Co.", "XNYS/NYS-MAIN"],
  PA: ["Paris", "PAR/EUR_FR"],
  MI: ["Milan", "MIL/EUR_IT"],
  FR: ["Frankfurt", "FR/EUR_DE"],
  AT: ["Athens", "AT/EUR_GR"],
};
const suffixes = ["L", "N", "OQ", "AS", "PA", "MI", "FR", "AT"];
const currencies = ["CAD", "GBX", "USD", "EUR", "GBP"];

const data: any[] = [];

/*
    each top level loop (20 x 'A...') has 64,000 iterations of nested loops, 
    so divide index by 64000 to get index of first character
    
    remainder is our index into next level of loops
    each second level loop ( 20 x 'A...') has, 3,200 iterations, so divide remainder by 
    3,200 to get index of second character

    each third level loop (20 x 'A...') has 160 iterations

*/

const maxIndex = 20 * 20 * 20 * 20 * 8;
console.log({ maxIndex });

// generateRow(1_000);
// generateRow(1_001);
// generateRow(1_002);
// generateRow(1_003);
// generateRow(1_004);
// generateRow(1_005);
// generateRow(1_006);
// generateRow(1_007);
// generateRow(1_008);
// generateRow(1_009);
// generateRow(50_000);
// generateRow(50_026);
// generateRow(100_000);

// console.time("generate");
// chars.forEach((c0) => {
//   //first level loop, 20 loops (of 64,000 nested iterations)
//   chars.forEach((c1) => {
//     //second level loop,  20 loops (of 3,200 nested iterations))
//     chars.forEach((c2) => {
//       //third level loop, 20 loops (of 160 nested iterations)
//       chars.forEach((c3) => {
//         //fourth level loop, 20 loops (of 8 nested iterations)
//         suffixes.forEach((suffix) => {
//           // fifth level loop, 8 loops, no nested iterations
//           const ric = `${c0}${c1}${c2}${c3}.${suffix}`;
//           const bbg = `${c0}${c1}${c2}${c3} ${suffix}`;
//           const isin = `${c0}${c1}${c2}${c3}`;
//           const description = `${ric} ${locations[suffix][0]}`;
//           data.push({
//             bbg,
//             ric,
//             isin,
//             description,
//             currency: currencies[random(0, 4)],
//             exchange: locations[suffix][1],
//             lotsize: random(10, 1000),
//           });
//         });
//       });
//     });
//   });
// });
// console.timeEnd("generate");

console.log(`instruments data-generator created ${data.length} rows`);

export const InstrumentRowGenerator: RowGenerator =
  (columns) => (index: number) => {
    if (index > maxIndex) {
      throw Error("generateRow index val is too high");
    }
    const index1 = Math.floor(index / 64000);
    const remainder1 = index % 64000;

    const index2 = Math.floor(remainder1 / 3200);
    const remainder2 = remainder1 % 3200;

    const index3 = Math.floor(remainder2 / 160);
    const remainder3 = remainder2 % 160;

    const index4 = Math.floor(remainder3 / 8);
    const remainder4 = remainder3 % 8;

    //   console.log(
    //     `index = ${index},
    //         char[0] = ${chars[index1]}, remainder = ${remainder1}
    //         char[1] = ${chars[index2]}, remainder = ${remainder2}
    //         char[2] = ${chars[index3]}, remainder = ${remainder3}
    //         char[4] = ${chars[index4]}, remainder = ${remainder4}
    //         suffix = -${suffixes[remainder4]}
    //         `
    //   );

    const suffix = suffixes[remainder4];

    const ric = `${chars[index1]}${chars[index2]}${chars[index3]}${chars[index4]}.${suffix}`;
    const bbg = `${chars[index1]}${chars[index2]}${chars[index3]}${chars[index4]} ${suffix}`;
    const isin = `${chars[index1]}${chars[index2]}${chars[index3]}${chars[index4]}`;
    const description = `${ric} ${locations[suffix][0]}`;
    const currency = currencies[random(0, 4)];
    const exchange = locations[suffix][1];
    const lotSize = random(10, 1000);
    return [bbg, currency, description, exchange, isin, lotSize, ric];
  };
