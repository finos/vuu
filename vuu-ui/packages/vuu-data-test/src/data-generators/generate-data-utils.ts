import { faker } from "@faker-js/faker";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";

export function createArray(numofrows: number): VuuRowDataItemType[][] {
  const result = [];

  for (let i = 0; i < numofrows; i++) {
    const FakerDataGenerator = [
      faker.company.name(),
      faker.finance.currencyCode(),
      Number(faker.finance.amount({ min: 5, max: 10, dec: 2 })),
      faker.finance.amount({ min: 100, max: 2000, dec: 0 }),
      faker.finance.transactionType(),
      faker.finance.transactionDescription(),
      faker.date.anytime().getMilliseconds(),
      faker.finance.accountName(),
      faker.finance.accountNumber(),
      faker.commerce.department(),
      faker.commerce.product(),
      faker.finance.amount({ min: 5, max: 10, dec: 2 }),
      faker.finance.amount({ min: 5, max: 10, dec: 2 }),
      faker.finance.amount({ min: 5, max: 10, dec: 2 }),
      faker.finance.amount({ min: 5, max: 10, dec: 2 }),
      faker.finance.amount({ min: 5, max: 10, dec: 2 }),
      faker.finance.amount({ min: 5, max: 10, dec: 2 }),
      faker.finance.amount({ min: 5, max: 10, dec: 2 }),
      faker.finance.amount({ min: 5, max: 10, dec: 2 }),
      faker.finance.amount({ min: 5, max: 10, dec: 2 }),
    ];
    result.push([
      i + 1,
      FakerDataGenerator[0],
      FakerDataGenerator[1],
      Number(FakerDataGenerator[2]),
      FakerDataGenerator[3] as number,
      Number(
        Math.floor(
          Number(FakerDataGenerator[2]) * Number(FakerDataGenerator[3])
        )
      ),
      FakerDataGenerator[4],
      FakerDataGenerator[5],
      FakerDataGenerator[6],
      FakerDataGenerator[7],
      FakerDataGenerator[8],
      FakerDataGenerator[9],
      FakerDataGenerator[10],
      FakerDataGenerator[11],
      FakerDataGenerator[12],
      FakerDataGenerator[13],
      FakerDataGenerator[14],
      FakerDataGenerator[15],
      FakerDataGenerator[16],
      FakerDataGenerator[17],
      Number(FakerDataGenerator[18]),
    ]);
  }

  return result;
}
